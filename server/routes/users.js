const express = require('express');
const { formatErrorMessage } = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Cấu hình Multer lưu ảnh avatar
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file hình ảnh (.jpg, .png, .webp, .gif)'));
    }
  }
});

// PUT /api/users/profile - Cập nhật thông tin & settings
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, grade, settings } = req.body;
    
    // Build update data
    const data = {};
    if (name) data.name = name;
    if (req.user.role === 'STUDENT' && grade) data.grade = parseInt(grade) || req.user.grade;
    if (settings) {
      // Validate settings object
      data.settings = typeof settings === 'object' ? settings : {};
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, role: true, grade: true, avatar: true, settings: true }
    });

    res.json({ message: 'Cập nhật thành công', user: updatedUser });
  } catch (error) {
    console.error('[Update Profile Error]', error);
    res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'Lỗi máy chủ') });
  }
});

// PUT /api/users/password - Đổi mật khẩu
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đủ mật khẩu cũ và mới' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('[Update Password Error]', error);
    res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'Lỗi máy chủ') });
  }
});

// POST /api/users/avatar - Upload Avatar
router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
      select: { id: true, name: true, email: true, role: true, grade: true, avatar: true, settings: true }
    });

    res.json({ message: 'Cập nhật ảnh đại diện thành công', user: updatedUser });
  } catch (error) {
    console.error('[Upload Avatar Error]', error);
    res.status(500).json({ message: formatErrorMessage(error, 'Lỗi máy chủ') });
  }
});

module.exports = router;
