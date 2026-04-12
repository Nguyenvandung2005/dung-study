import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { getContactType, sanitizeUser, signToken } from "../utils/auth.js";

// Gom toàn bộ route liên quan đến người dùng và quản trị người dùng.
export function createUserRouter({ authMiddleware, adminMiddleware, jwtSecret }) {
  const router = Router();

  // Kiểm tra email/số điện thoại đã tồn tại trước khi gửi OTP hoặc tạo tài khoản.
  router.post("/auth/check-contact", async (req, res) => {
    const contact = String(req.body?.contact || "").trim().toLowerCase();

    if (!contact) {
      return res.status(400).json({ message: "Thieu email hoac so dien thoai." });
    }

    const exists = await User.exists({
      $or: [{ email: contact }, { phone: contact }],
    });

    return res.json({ exists: Boolean(exists) });
  });

  // Đăng ký tài khoản mới, hash mật khẩu rồi lưu vào MongoDB.
  router.post("/auth/register", async (req, res) => {
    const {
      contact = "",
      password = "",
      name = "",
      gender = "khong_xac_dinh",
      dob = "",
    } = req.body || {};

    const normalizedContact = String(contact).trim().toLowerCase();

    if (!normalizedContact || !password || !String(name).trim()) {
      return res.status(400).json({ message: "Thieu thong tin bat buoc." });
    }

    const exists = await User.findOne({
      $or: [{ email: normalizedContact }, { phone: normalizedContact }],
    });

    if (exists) {
      return res.status(409).json({ message: "Email hoac so dien thoai nay da duoc dang ky." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const contactType = getContactType(normalizedContact);
    const userPayload = {
      name: String(name).trim(),
      passwordHash,
      role: "user",
      gender,
      dob,
    };

    if (contactType === "email") {
      userPayload.email = normalizedContact;
    } else {
      userPayload.phone = normalizedContact;
    }

    const user = await User.create(userPayload);
    return res.status(201).json({ user: sanitizeUser(user) });
  });

  // Đăng nhập và trả về token JWT cho frontend lưu lại.
  router.post("/auth/login", async (req, res) => {
    const { contact = "", password = "" } = req.body || {};
    const normalizedContact = String(contact).trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: normalizedContact }, { phone: normalizedContact }],
    });

    if (!user) {
      return res.status(401).json({ message: "Email/SDT hoac mat khau khong dung." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Email/SDT hoac mat khau khong dung." });
    }

    return res.json({
      token: signToken(user, jwtSecret),
      user: sanitizeUser(user),
    });
  });

  // Lấy thông tin user đang đăng nhập từ token hiện tại.
  router.get("/auth/me", authMiddleware, (req, res) => {
    res.json({ user: sanitizeUser(req.user) });
  });

  // Admin xem danh sách user trong hệ thống.
  router.get("/admin/users", authMiddleware, adminMiddleware, async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(sanitizeUser));
  });

  return router;
}
