const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');
const { detectThreat, recordFailedAttempt, recordSuccessEvent } = require('../utils/threatDetector');

const router = express.Router();
const prisma = new PrismaClient();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  validate: { trustProxy: false },
  message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút' },
});

const generateTokens = (userId) => {
  const secret = process.env.JWT_SECRET || 'dung_study_secret_key_123456_secure';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || secret;
  const accessToken = jwt.sign({ userId }, secret, { expiresIn: '2h' });
  const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, role, grade } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    // Auto-admin for system email
    const isAdminEmail = email === process.env.ADMIN_EMAIL;
    const userRole = isAdminEmail ? 'ADMIN' : (role || 'STUDENT');

    const user = await prisma.user.create({
      data: {
        name, email, password: hashedPassword,
        role: userRole,
        grade: userRole === 'STUDENT' ? (parseInt(grade) || null) : null,
        isVerified: true, // Skip email verify for now (can add later)
      },
      select: { id: true, name: true, email: true, role: true, grade: true, avatar: true }
    });

    await recordSuccessEvent(req, 'REGISTER', user.id);
    const { accessToken, refreshToken } = generateTokens(user.id);
    res.status(201).json({ message: 'Đăng ký thành công', user, accessToken, refreshToken });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
    }

    const threat = await detectThreat(req, 'LOGIN_FAIL');
    if (threat.blocked) {
      return res.status(429).json({ message: `Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Thử lại sau ${Math.ceil(threat.retryAfter / 60)} phút.` });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await recordFailedAttempt(req, 'LOGIN_FAIL');
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    if (user.isLocked) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa. Vui lòng liên hệ admin.' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      await recordFailedAttempt(req, 'LOGIN_FAIL', user.id);
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    await recordSuccessEvent(req, 'LOGIN_SUCCESS', user.id);
    const { accessToken, refreshToken } = generateTokens(user.id);
    const userData = { id: user.id, name: user.name, email: user.email, role: user.role, grade: user.grade, avatar: user.avatar };
    res.json({ message: 'Đăng nhập thành công', user: userData, accessToken, refreshToken });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ message: error.message || 'Lỗi máy chủ' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Không có refresh token' });
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dung_study_secret_key_123456_secure';
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, name: true, email: true, role: true, grade: true, avatar: true, isLocked: true } });
    if (!user || user.isLocked) return res.status(401).json({ message: 'Token không hợp lệ' });
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);
    res.json({ accessToken, refreshToken: newRefreshToken, user });
  } catch {
    res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  const user = req.user;
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, grade: user.grade, avatar: user.avatar });
});

module.exports = router;
