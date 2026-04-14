import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { seedDatabase } from "./seed.js";
import { createAuthMiddleware, adminMiddleware } from "./middlewares/auth.js";
import { createUserRouter } from "./routes/user.js";
import { createProductRouter } from "./routes/product.js";
import { createCartRouter } from "./routes/cart.js";

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "pinkycloud-dev-secret";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pinkycloud";

// Khởi tạo các middleware chung cho toàn bộ API.
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const authMiddleware = createAuthMiddleware(JWT_SECRET);

// Health-check để frontend và tool debug kiểm tra backend còn hoạt động.
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Mount các nhóm route nghiệp vụ chính.
app.use("/api", createUserRouter({ authMiddleware, adminMiddleware, jwtSecret: JWT_SECRET }));
app.use("/api/products", createProductRouter({ authMiddleware, adminMiddleware }));
app.use("/api/cart", createCartRouter({ authMiddleware }));

async function startServer() {
  // Kết nối MongoDB trước, seed dữ liệu ban đầu rồi mới mở cổng API.
  await mongoose.connect(MONGODB_URI);
  console.log("MONGODB_URI =", MONGODB_URI);
  console.log("cwd =", process.cwd());
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Cannot start server:", error);
  process.exit(1);
});
