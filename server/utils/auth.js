import jwt from "jsonwebtoken";

// Loại bỏ các trường nhạy cảm trước khi trả user về cho frontend.
export function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : user;
  const { passwordHash, __v, _id, updatedAt, ...safeUser } = obj;
  safeUser.id = obj._id?.toString?.() || obj.id;
  return safeUser;
}

// Tạo JWT sau khi đăng nhập thành công để frontend dùng cho các request cần xác thực.
export function signToken(user, jwtSecret) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: "7d" },
  );
}

// Xác định kiểu liên hệ để lưu đúng vào `email` hoặc `phone`.
export function getContactType(contact) {
  return contact.includes("@") ? "email" : "phone";
}
