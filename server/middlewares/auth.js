import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// Tạo middleware xác thực để kiểm tra JWT và nạp user hiện tại vào `req.user`.
export function createAuthMiddleware(jwtSecret) {
  return async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ message: "Thieu token dang nhap." });
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      const user = await User.findById(payload.sub);

      if (!user) {
        return res.status(401).json({ message: "Tai khoan khong con ton tai." });
      }

      req.user = user;
      return next();
    } catch {
      return res.status(401).json({ message: "Token khong hop le hoac da het han." });
    }
  };
}

// Chặn các route chỉ dành cho tài khoản quản trị.
export function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Ban khong co quyen quan tri." });
  }

  return next();
}
