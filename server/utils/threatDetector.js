const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Track failed login attempts per IP in memory (supplement with DB)
const failedAttempts = new Map();
const BLOCK_THRESHOLD = 5;
const BLOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
};

const logSecurityEvent = async (data) => {
  try {
    await prisma.securityLog.create({ data });
  } catch (e) {
    console.error('[SecurityLog Error]', e.message);
  }
};

const detectThreat = async (req, action, userId = null) => {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const now = Date.now();

  const key = `${ip}:${action}`;
  const record = failedAttempts.get(key) || { count: 0, firstAttempt: now, blockedUntil: 0 };

  if (record.blockedUntil && now < record.blockedUntil) {
    await logSecurityEvent({
      ip, userAgent, action: 'BLOCKED_REQUEST', severity: 'HIGH',
      userId, details: { reason: 'IP temporarily blocked', originalAction: action }
    });
    return { blocked: true, retryAfter: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  // Reset window if expired
  if (now - record.firstAttempt > BLOCK_WINDOW_MS) {
    failedAttempts.set(key, { count: 0, firstAttempt: now, blockedUntil: 0 });
  }

  return { blocked: false };
};

const adminEventHub = require('./adminEventHub');

const recordFailedAttempt = async (req, action, userId = null) => {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const now = Date.now();
  const key = `${ip}:${action}`;

  const record = failedAttempts.get(key) || { count: 0, firstAttempt: now, blockedUntil: 0 };
  record.count++;

  let severity = 'LOW';
  if (record.count >= BLOCK_THRESHOLD) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    severity = 'HIGH';
    console.warn(`[ThreatDetector] IP ${ip} BLOCKED for ${action} (${record.count} attempts)`);
    await logSecurityEvent({ ip, userAgent, action: 'BRUTE_FORCE_DETECTED', severity: 'CRITICAL', userId, details: { attempts: record.count } });
    adminEventHub.broadcastEvent({
      type: 'SECURITY_THREAT',
      title: '🚨 Cảnh báo xâm nhập / Brute Force!',
      message: `Phát hiện IP ${ip} thử sai liên tiếp ${record.count} lần (${action}).`,
      severity: 'CRITICAL',
      data: { ip, action, count: record.count },
      actionSuggestion: {
        label: '🚫 Chặn IP này trong 30 phút',
        actionType: 'BLOCK_IP',
        target: ip
      }
    });
  } else if (record.count >= 3) {
    severity = 'MEDIUM';
    adminEventHub.broadcastEvent({
      type: 'SECURITY_THREAT',
      title: '⚠️ Phát hiện hoạt động đáng ngờ',
      message: `IP ${ip} có ${record.count} lần thao tác thất bại liên tiếp (${action}).`,
      severity: 'MEDIUM',
      data: { ip, action, count: record.count },
      actionSuggestion: {
        label: '🚫 Chặn IP này trong 30 phút',
        actionType: 'BLOCK_IP',
        target: ip
      }
    });
  }

  failedAttempts.set(key, record);

  await logSecurityEvent({ ip, userAgent, action, severity, userId, details: { attemptCount: record.count } });
};

const recordSuccessEvent = async (req, action, userId = null) => {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const key = `${ip}:${action.replace('_SUCCESS', '_FAIL')}`;
  failedAttempts.delete(key);

  await logSecurityEvent({ ip, userAgent, action, severity: 'LOW', userId, details: null });
};

const blockIP = async (ip, durationMinutes = 30, reason = 'Admin manual block', adminId = null) => {
  const now = Date.now();
  const blockedUntil = now + durationMinutes * 60 * 1000;
  
  ['LOGIN', 'REGISTER', 'EXAM_SUBMIT', 'API'].forEach(action => {
    failedAttempts.set(`${ip}:${action}`, { count: 99, firstAttempt: now, blockedUntil });
  });

  await logSecurityEvent({
    ip,
    userAgent: 'Admin Action',
    action: 'ADMIN_BLOCK_IP',
    severity: 'HIGH',
    userId: adminId,
    details: { durationMinutes, reason, blockedUntil }
  });

  return { ip, blockedUntil, durationMinutes };
};

module.exports = { detectThreat, recordFailedAttempt, recordSuccessEvent, getClientIP, logSecurityEvent, blockIP };
