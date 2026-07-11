/**
 * Helper định dạng thông báo lỗi sang tiếng Việt dễ hiểu cho người dùng
 */
function formatErrorMessage(error) {
  if (!error) return 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.';
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
    return 'Máy chủ cơ sở dữ liệu đang tạm dừng hoặc không thể kết nối. Vui lòng bật lại database (Power On trên Aiven Cloud) hoặc thử lại sau ít phút.';
  }

  // 2. Lỗi trùng lặp dữ liệu (Unique constraint failed - P2002)
  if (msg.includes('P2002') || msg.includes('Unique constraint failed')) {
    return 'Dữ liệu này đã tồn tại trong hệ thống (ví dụ: Email đã được sử dụng). Vui lòng kiểm tra lại.';
  }

  // 3. Lỗi không tìm thấy dữ liệu (Record not found - P2025)
  if (msg.includes('P2025') || msg.includes('Record to update not found')) {
    return 'Không tìm thấy dữ liệu yêu cầu.';
  }

  // 4. Các lỗi kỹ thuật từ Prisma hoặc có chứa đường dẫn file/stack trace
  if (
    msg.includes('Invalid `prisma.') ||
    msg.includes('prisma.') ||
    msg.includes('invocation in') ||
    msg.includes(':\\') ||
    msg.includes('node_modules') ||
    msg.includes('PrismaClient')
  ) {
    return 'Hệ thống đang gặp sự cố khi truy vấn cơ sở dữ liệu. Vui lòng thử lại sau.';
  }

  // 5. Lỗi token / JWT
  if (msg.includes('jwt expired') || msg.includes('invalid token')) {
    return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
  }

  // 6. Trả về thông báo lỗi ngắn gọn nếu là câu thông báo tiếng Việt/thông thường
  return msg || 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.';
}

module.exports = {
  formatErrorMessage,
};
