import { Router } from "express";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";

// Gom toàn bộ route liên quan đến giỏ hàng của user.
export function createCartRouter({ authMiddleware }) {
  const router = Router();

  // Lấy giỏ hàng của user đang đăng nhập và map lại dữ liệu sản phẩm đầy đủ.
  router.get("/", authMiddleware, async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.json({ items: [] });
    }

    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({ id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const items = cart.items
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return null;
        return {
          id: item.productId,
          product,
          quantity: item.quantity,
        };
      })
      .filter(Boolean);

    return res.json({ items });
  });

  // Ghi đè toàn bộ giỏ hàng hiện tại của user theo trạng thái frontend gửi lên.
  router.put("/", authMiddleware, async (req, res) => {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const items = rawItems
      .map((item) => ({
        productId: String(item.productId || item.id || ""),
        quantity: Math.max(1, Number(item.quantity || 1)),
      }))
      .filter((item) => item.productId);

    const productIds = items.map((item) => item.productId);
    const existingProducts = await Product.find({ id: { $in: productIds } }).select("id");
    const existingSet = new Set(existingProducts.map((product) => product.id));
    const safeItems = items.filter((item) => existingSet.has(item.productId));

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { user: req.user._id, items: safeItems },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return res.json({ items: cart.items });
  });

  return router;
}
