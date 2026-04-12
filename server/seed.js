import { promises as fs } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { User } from "./models/User.js";
import { Product } from "./models/Product.js";

// Đọc dữ liệu sản phẩm mẫu từ frontend để seed lần đầu cho MongoDB.
async function loadSeedProducts() {
  const sourcePath = path.resolve("src", "data", "products.json");
  const raw = await fs.readFile(sourcePath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : parsed.products ?? [];
}

export async function seedDatabase() {
  // Tạo sẵn một tài khoản admin mặc định nếu database chưa có.
  const adminEmail = "admin@pinkycloud.vn";
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await User.create({
      name: "Quan tri vien",
      email: adminEmail,
      passwordHash,
      role: "admin",
      gender: "khong_xac_dinh",
      dob: "",
    });
  }

  // Dọn các giá trị rỗng cũ để tránh đụng unique index trên email/phone.
  await User.updateMany({ email: "" }, { $unset: { email: 1 } });
  await User.updateMany({ phone: "" }, { $unset: { phone: 1 } });

  // Chỉ seed sản phẩm khi collection còn trống.
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    const seedProducts = await loadSeedProducts();
    if (seedProducts.length > 0) {
      await Product.insertMany(seedProducts, { ordered: false });
    }
  }
}
