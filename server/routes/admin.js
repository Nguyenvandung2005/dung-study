const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');

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

module.exports = router;
