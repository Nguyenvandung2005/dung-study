const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');
const { detectThreat, recordFailedAttempt, recordSuccessEvent } = require('../utils/threatDetector');
const { formatErrorMessage } = require('../utils/errorHandler');
const adminEventHub = require('../utils/adminEventHub');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const router = express.Router();
const prisma = new PrismaClient();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

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
    adminEventHub.broadcastEvent({
      type: 'USER_REGISTER',
      title: 'Thành viên mới đăng ký! 🎉',
      message: `${user.name} (${user.email}) vừa tạo tài khoản với vai trò ${user.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}.`,
      data: { email: user.email, role: user.role },
      actionSuggestion: {
        label: '📋 Xem chi tiết log bảo mật',
        actionType: 'VIEW_LOG',
        target: '/admin/security'
      }
    });
    const { accessToken, refreshToken } = generateTokens(user.id);
    res.status(201).json({ message: 'Đăng ký thành công', user, accessToken, refreshToken });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ message: formatErrorMessage(error) });
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
    adminEventHub.broadcastEvent({
      type: 'USER_LOGIN',
      title: 'Người dùng vừa đăng nhập 🔑',
      message: `${user.name} (${user.email}) vừa đăng nhập vào hệ thống.`,
      data: { email: user.email, role: user.role },
      actionSuggestion: {
        label: '📋 Xem chi tiết log bảo mật',
        actionType: 'VIEW_LOG',
        target: '/admin/security'
      }
    });
    const { accessToken, refreshToken } = generateTokens(user.id);
    const userData = { id: user.id, name: user.name, email: user.email, role: user.role, grade: user.grade, school: user.school, avatar: user.avatar, settings: user.settings };
    res.json({ message: 'Đăng nhập thành công', user: userData, accessToken, refreshToken });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ message: formatErrorMessage(error) });
  }
});

// POST /api/auth/google
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential, role, grade } = req.body;
    let payload;

    // Frontend (useGoogleLogin) gửi access_token → dùng Google userinfo API
    // Nếu là id_token (JWT) → dùng verifyIdToken
    try {
      const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credential}` },
      });
      payload = userInfoRes.data; // { sub, email, name, picture }
    } catch {
      // Fallback: thử verify như id_token
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        payload = jwt.decode(credential);
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Không thể xác thực với Google' });
    }

    const { email, name, picture } = payload;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Register
      const userRole = (email === process.env.ADMIN_EMAIL) ? 'ADMIN' : (role || 'STUDENT');
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 12);
      user = await prisma.user.create({
        data: {
          name, email, password: hashedPassword, role: userRole,
          grade: userRole === 'STUDENT' ? (parseInt(grade) || null) : null,
          avatar: picture, isVerified: true,
        },
      });
      adminEventHub.broadcastEvent({
        type: 'USER_REGISTER',
        title: 'Thành viên mới (Google)! 🎉',
        message: `${user.name} vừa đăng ký bằng Google.`,
        data: { email: user.email, role: user.role }
      });
    } else if (user.isLocked) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa.' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    const userData = { id: user.id, name: user.name, email: user.email, role: user.role, grade: user.grade, school: user.school, avatar: user.avatar, settings: user.settings };
    res.json({ message: 'Đăng nhập Google thành công', user: userData, accessToken, refreshToken });
  } catch (error) {
    console.error('[Google Auth Error]', error);
    res.status(500).json({ message: formatErrorMessage(error) });
  }
});


// POST /api/auth/facebook
router.post('/facebook', authLimiter, async (req, res) => {
  try {
    const { accessToken: fbAccessToken, role, grade } = req.body;
    
    // Call Facebook Graph API
    const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${fbAccessToken}`);
    const { email, name, picture, id: fbId } = response.data;
    
    // Nếu Facebook ko cấp quyền email, xài email giả từ ID
    const userEmail = email || `${fbId}@facebook.dummy.com`;

    let user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      const userRole = (userEmail === process.env.ADMIN_EMAIL) ? 'ADMIN' : (role || 'STUDENT');
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 12);
      const avatarUrl = picture?.data?.url || null;
      user = await prisma.user.create({
        data: {
          name, email: userEmail, password: hashedPassword, role: userRole,
          grade: userRole === 'STUDENT' ? (parseInt(grade) || null) : null,
          avatar: avatarUrl, isVerified: true,
        },
      });
    } else if (user.isLocked) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa.' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    const userData = { id: user.id, name: user.name, email: user.email, role: user.role, grade: user.grade, school: user.school, avatar: user.avatar, settings: user.settings };
    res.json({ message: 'Đăng nhập Facebook thành công', user: userData, accessToken, refreshToken });
  } catch (error) {
    console.error('[Facebook Auth Error]', error);
    res.status(500).json({ message: 'Đăng nhập bằng Facebook thất bại' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Không có refresh token' });
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dung_study_secret_key_123456_secure';
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { id: true, name: true, email: true, role: true, grade: true, school: true, avatar: true, settings: true, isLocked: true } });
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
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, grade: user.grade, school: user.school, avatar: user.avatar, settings: user.settings });
});

module.exports = router;
