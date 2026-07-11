const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const adminEventHub = require('../utils/adminEventHub');
const { blockIP } = require('../utils/threatDetector');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/dashboard
router.get('/dashboard', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const [totalUsers, totalExams, totalSubmissions, pendingGrading, recentLogs] = await Promise.all([
      prisma.user.count(),
      prisma.exam.count(),
      prisma.submission.count({ where: { status: { in: ['SUBMITTED', 'GRADED'] } } }),
      prisma.gradingTask.count({ where: { status: 'PENDING' } }),
      prisma.securityLog.findMany({
        orderBy: { createdAt: 'desc' }, take: 20,
        include: { user: { select: { name: true, email: true } } }
      }),
    ]);

    const usersByRole = await prisma.user.groupBy({ by: ['role'], _count: true });
    const criticalLogs = await prisma.securityLog.count({ where: { severity: { in: ['HIGH', 'CRITICAL'] }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });

    res.json({ totalUsers, totalExams, totalSubmissions, pendingGrading, usersByRole, criticalLogs, recentLogs });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải dashboard' });
  }
});

// GET /api/admin/users
router.get('/users', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { search, role, grade, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    if (role) where.role = role;
    if (grade) where.grade = parseInt(grade);
    if (status === 'locked') where.isLocked = true;
    if (status === 'active') where.isLocked = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip: (page - 1) * limit, take: parseInt(limit), orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, role: true, grade: true, isLocked: true, isVerified: true, createdAt: true } }),
      prisma.user.count({ where })
    ]);
    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải danh sách người dùng' });
  }
});

// PATCH /api/admin/users/:id/lock
router.patch('/users/:id/lock', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { isLocked } = req.body;
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { isLocked } });
    res.json({ message: isLocked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật tài khoản' });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
    res.json({ message: 'Đã cập nhật vai trò', user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật vai trò' });
  }
});

// GET /api/admin/security-logs
router.get('/security-logs', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { severity, page = 1, limit = 50 } = req.query;
    const where = {};
    if (severity) where.severity = severity;
    const logs = await prisma.securityLog.findMany({
      where, skip: (page - 1) * limit, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, role: true, grade: true } } }
    });
    const total = await prisma.securityLog.count({ where });
    res.json({ logs, total });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải logs bảo mật' });
  }
});

// GET /api/admin/animation-themes
router.get('/animation-themes', async (req, res) => {
  try {
    const themes = await prisma.animationTheme.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(themes);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải themes' });
  }
});

// PUT /api/admin/animation-themes/active
router.put('/animation-themes/active', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { themeId } = req.body;
    await prisma.animationTheme.updateMany({ data: { isActive: false } });
    const theme = await prisma.animationTheme.update({ where: { id: themeId }, data: { isActive: true } });
    res.json({ message: 'Đã áp dụng theme', theme });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đổi theme' });
  }
});

// POST /api/admin/animation-themes/custom
router.post('/animation-themes/custom', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { colorTheme, animationType } = req.body;
    const name = `${colorTheme}-${animationType}`;
    
    let theme = await prisma.animationTheme.findFirst({ where: { name } });
    
    if (!theme) {
      theme = await prisma.animationTheme.create({
        data: {
          name,
          displayName: `Custom: ${colorTheme} + ${animationType}`,
          config: { colorTheme, type: animationType },
          isActive: false
        }
      });
    }

    await prisma.animationTheme.updateMany({ data: { isActive: false } });
    await prisma.animationTheme.update({ where: { id: theme.id }, data: { isActive: true } });
    
    res.json({ message: 'Đã áp dụng giao diện hệ thống mới', theme });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi cấu hình giao diện' });
  }
});

// GET /api/admin/anomalies — AI-assisted anomaly detection summary
router.get('/anomalies', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const criticalLogs = await prisma.securityLog.findMany({
      where: { severity: { in: ['HIGH', 'CRITICAL'] }, createdAt: { gte: since } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Group by IP
    const ipGroups = {};
    criticalLogs.forEach(log => {
      if (!ipGroups[log.ip]) ipGroups[log.ip] = [];
      ipGroups[log.ip].push(log);
    });

    const anomalies = Object.entries(ipGroups).map(([ip, logs]) => ({
      ip,
      count: logs.length,
      maxSeverity: logs.some(l => l.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH',
      actions: [...new Set(logs.map(l => l.action))],
      affectedUsers: logs.filter(l => l.user).map(l => l.user),
      firstSeen: logs[logs.length - 1].createdAt,
      lastSeen: logs[0].createdAt,
      recommendation: logs.length >= 10 ? 'BLOCK_IP' : logs.length >= 5 ? 'MONITOR' : 'WATCH',
    }));

    res.json({ anomalies, totalCritical: criticalLogs.length });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi phân tích bất thường' });
  }
});

// GET /api/admin/events/stream — Real-time SSE event stream for Admin
router.get('/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  adminEventHub.addClient(res);

  req.on('close', () => {
    adminEventHub.removeClient(res);
  });
});

// GET /api/admin/recent-events — Get recent activity events merged with persistent DB logs
router.get('/recent-events', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const memoryEvents = adminEventHub.getRecentEvents();

    const recentLogs = await prisma.securityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });

    const dbEvents = recentLogs.map(log => {
      let title = 'Hoạt động hệ thống 🔔';
      let message = `IP ${log.ip} đã thực hiện ${log.action}`;
      let type = log.action;
      let suggestion = {
        label: '📋 Xem chi tiết log bảo mật',
        actionType: 'VIEW_LOG',
        target: '/admin/security'
      };

      if (log.action === 'LOGIN_SUCCESS') {
        type = 'USER_LOGIN';
        title = 'Người dùng vừa đăng nhập 🔑';
        message = `${log.user?.name || 'Thành viên'} (${log.user?.email || log.ip}) vừa đăng nhập hệ thống.`;
      } else if (log.action === 'REGISTER') {
        type = 'USER_REGISTER';
        title = 'Thành viên mới đăng ký! 🎉';
        message = `${log.user?.name || 'Thành viên'} (${log.user?.email || log.ip}) vừa tạo tài khoản (${log.user?.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}).`;
      } else if (log.action === 'BRUTE_FORCE_DETECTED' || log.severity === 'CRITICAL' || log.severity === 'HIGH') {
        type = 'SECURITY_THREAT';
        title = '🚨 Cảnh báo xâm nhập / Bất thường!';
        message = `Phát hiện IP ${log.ip} có thao tác thất bại hoặc hành vi đáng ngờ (${log.action}).`;
        suggestion = {
          label: '🚫 Chặn IP này trong 30 phút',
          actionType: 'BLOCK_IP',
          target: log.ip
        };
      } else if (log.action === 'EXAM_SUBMITTED') {
        type = 'EXAM_SUBMITTED';
        title = 'Học sinh vừa nộp bài thi! ✍️';
        message = `${log.user?.name || 'Học sinh'} vừa hoàn thành đề kiểm tra.`;
        suggestion = {
          label: '📄 Xem kết quả bài thi',
          actionType: 'NAVIGATE',
          target: '/admin/exams'
        };
      }

      return {
        id: `db-${log.id}`,
        type,
        title,
        message,
        severity: log.severity,
        timestamp: log.createdAt,
        data: { ip: log.ip, action: log.action },
        actionSuggestion: suggestion
      };
    });

    // Deduplicate memory events against database logs so actions (e.g. USER_LOGIN) appear only once
    const uniqueMemoryEvents = memoryEvents.filter(mEv => {
      const mTime = new Date(mEv.timestamp).getTime();
      return !dbEvents.some(dEv => {
        if (dEv.id === mEv.id) return true;
        if (dEv.type === mEv.type) {
          const dTime = new Date(dEv.timestamp).getTime();
          if (Math.abs(mTime - dTime) < 60000) return true;
        }
        return false;
      });
    });

    const combined = [...dbEvents, ...uniqueMemoryEvents];
    combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ events: combined.slice(0, 30) });
  } catch (err) {
    res.json({ events: adminEventHub.getRecentEvents() });
  }
});

// POST /api/admin/block-ip — Block suspicious IP for durationMinutes
router.post('/block-ip', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { ip, durationMinutes = 30, reason = 'Chặn nhanh từ thông báo Admin' } = req.body;
    if (!ip) return res.status(400).json({ message: 'Thiếu địa chỉ IP' });

    const result = await blockIP(ip, durationMinutes, reason, req.user.id);
    res.json({ message: `Đã chặn IP ${ip} trong ${durationMinutes} phút`, result });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi chặn IP' });
  }
});

module.exports = router;
