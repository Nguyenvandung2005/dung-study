const fs = require('fs');
const path = require('path');

/**
 * Ghi log lỗi chi tiết ra file để admin có thể debug sau này
 */
function logErrorToFile(error, originalMsg) {
  try {
    const logPath = path.join(__dirname, '..', 'error.log');
    const timestamp = new Date().toISOString();
    const logEntry = `\n[${timestamp}] ERROR: ${originalMsg}\nSTACK: ${error.stack || ''}\n`;
    fs.appendFileSync(logPath, logEntry, 'utf8');
  } catch (e) {
    console.error('Không thể ghi log lỗi:', e);
  }
}

/**
 * Helper định dạng thông báo lỗi sang tiếng Việt dễ hiểu cho người dùng
 * Đóng vai trò như một Firewall chặn thông tin nhạy cảm.
 * @param {Error|String} error - Đối tượng lỗi hoặc chuỗi thông báo lỗi
 * @param {String} fallbackMsg - Thông điệp mặc định an toàn nếu lỗi bị chặn
 */
function formatErrorMessage(error, fallbackMsg = 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.') {
  if (!error) return fallbackMsg;
  const msg = typeof error === 'string' ? error : (error.message || '');

  // 1. Lỗi kết nối Cơ sở dữ liệu / Prisma Connection Errors
  if (
    msg.includes("Can't reach database server") ||
    msg.includes('PrismaClientInitializationError') ||
    msg.includes('P1001') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ENOTFOUND')
  ) {
    logErrorToFile(error, msg);
    return 'Máy chủ cơ sở dữ liệu đang tạm dừng hoặc không thể kết nối. Vui lòng thử lại sau ít phút.';
  }

  // 2. Lỗi trùng lặp dữ liệu (Unique constraint failed - P2002)
  if (msg.includes('P2002') || msg.includes('Unique constraint failed')) {
    return 'Dữ liệu này đã tồn tại trong hệ thống (ví dụ: Email đã được sử dụng). Vui lòng kiểm tra lại.';
  }

  // 3. Lỗi không tìm thấy dữ liệu (Record not found - P2025)
  if (msg.includes('P2025') || msg.includes('Record to update not found')) {
    return 'Không tìm thấy dữ liệu yêu cầu.';
  }

  // 4. Lỗi token / JWT
  if (msg.includes('jwt expired') || msg.includes('invalid token')) {
    return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
  }

  // 5. BLACKLIST - Kiểm duyệt nghiêm ngặt (Strict Firewall)
  // Nếu thông báo chứa bất kỳ từ khóa kỹ thuật nào, CHẶN NGAY LẬP TỨC!
  const blacklist = [
    'prisma', 'sql', 'select', 'insert', 'update', 'delete', 'where', 'node_modules', 
    ':\\', '/', 'invocation in', 'invalid `', 'error:', 'failed', 'undefined', 'null',
    'syntax', 'typeerror', 'referenceerror', 'unhandled', 'promise', 'fetch', 'axios'
  ];

  const msgLower = msg.toLowerCase();
  const isBlacklisted = blacklist.some(keyword => msgLower.includes(keyword));

  if (isBlacklisted) {
    // Lưu lại lỗi thật vào file để dev xem
    logErrorToFile(error, msg);
    // Trả về câu chung chung + fallback context
    return fallbackMsg;
  }

  // 6. Trả về thông báo lỗi ngắn gọn nếu là câu thông báo tiếng Việt an toàn
  return msg || fallbackMsg;
}

module.exports = {
  formatErrorMessage,
};
