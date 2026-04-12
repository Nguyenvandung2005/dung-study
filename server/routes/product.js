import { Router } from "express";
import { Product } from "../models/Product.js";

// Gom toàn bộ route liên quan đến sản phẩm.
export function createProductRouter({ authMiddleware, adminMiddleware }) {
  const router = Router();

  // Lấy danh sách sản phẩm cho trang listing và tìm kiếm.
  router.get("/", async (_req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  });

  // Lấy chi tiết một sản phẩm theo id.
  router.get("/:id", async (req, res) => {
    const product = await Product.findOne({ id: req.params.id });

    if (!product) {
      return res.status(404).json({ message: "Khong tim thay san pham." });
    }

    return res.json(product);
  });

  // Admin tạo sản phẩm mới.
  router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    const payload = req.body || {};

    const product = {
      id: payload.id || `pc-${Date.now()}`,
      name: payload.name || "",
      price: Number(payload.price || 0),
      currency: payload.currency || "VND",
      image: payload.image || "",
      category: payload.category || "",
      brand: payload.brand || "",
      description: payload.description || "",
      origin: payload.origin || "",
      ingredients: payload.ingredients || "",
      usage: payload.usage || "",
      discount: Number(payload.discount || 0),
    };

    if (!product.name || !product.category || !product.brand) {
      return res.status(400).json({ message: "Thieu thong tin san pham bat buoc." });
    }

    const exists = await Product.findOne({ id: product.id });
    if (exists) {
      return res.status(409).json({ message: "ID san pham da ton tai." });
    }

    const created = await Product.create(product);
    return res.status(201).json(created);
  });

  // Admin cập nhật sản phẩm hiện có.
  router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const current = await Product.findOne({ id: req.params.id });

    if (!current) {
      return res.status(404).json({ message: "Khong tim thay san pham." });
    }

    current.name = req.body?.name ?? current.name;
    current.price = Number(req.body?.price ?? current.price);
    current.currency = req.body?.currency ?? current.currency;
    current.image = req.body?.image ?? current.image;
    current.category = req.body?.category ?? current.category;
    current.brand = req.body?.brand ?? current.brand;
    current.description = req.body?.description ?? current.description;
    current.origin = req.body?.origin ?? current.origin;
    current.ingredients = req.body?.ingredients ?? current.ingredients;
    current.usage = req.body?.usage ?? current.usage;
    current.discount = Number(req.body?.discount ?? current.discount ?? 0);

    await current.save();
    return res.json(current);
  });

  // Admin xóa sản phẩm khỏi hệ thống.
  router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const deleted = await Product.findOneAndDelete({ id: req.params.id });

    if (!deleted) {
      return res.status(404).json({ message: "Khong tim thay san pham." });
    }

    return res.status(204).end();
  });

  return router;
}
