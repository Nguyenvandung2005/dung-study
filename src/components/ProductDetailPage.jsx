import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import products from "../data/products";
import ProductCard from "./ProductCard";
import { useCart } from "./CartContext";

function formatVnd(value) {
  return `${value.toLocaleString("vi-VN")}₫`;
}

function buildProductDetails(product) {
  return {
    description:
      product.description ||
      `${product.name} là lựa chọn nổi bật từ ${product.brand}, phù hợp cho nhu cầu ${product.category.toLowerCase()} hằng ngày.`,
    origin: product.origin || "Hàn Quốc / Pháp / Nhật Bản tùy lô nhập khẩu",
    ingredients:
      product.ingredients ||
      "Thành phần đang được cập nhật theo thông tin từ thương hiệu và nhà phân phối.",
    usage:
      product.usage ||
      "Sử dụng theo hướng dẫn của thương hiệu, bảo quản nơi khô ráo và tránh ánh nắng trực tiếp.",
  };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const product = products.find((item) => item.id === id);
  const productDetails = product ? buildProductDetails(product) : null;

  const relatedProducts = useMemo(() => {
    if (!product) {
      return [];
    }

    return products
      .filter((item) => item.category === product.category && item.id !== product.id)
      .slice(0, 4);
  }, [product]);

  if (!product || !productDetails) {
    return (
      <section className="container py-5 text-center">
        <h1 style={{ fontWeight: 700 }}>Không tìm thấy sản phẩm</h1>
        <p className="text-muted">
          Sản phẩm bạn đang tìm có thể đã được cập nhật hoặc không còn hiển thị.
        </p>
        <Link to="/san-pham" className="btn" style={{ background: "#f76c85", color: "#fff" }}>
          Quay lại bộ sưu tập
        </Link>
      </section>
    );
  }

  return (
    <section className="container py-4 py-lg-5">
      <div className="mb-4">
        <Link to="/san-pham" className="text-decoration-none text-secondary">
          ← Quay lại bộ sưu tập
        </Link>
      </div>

      <div className="row g-5">
        <div className="col-12 col-lg-5">
          <div
            className="bg-white rounded-4 border d-flex justify-content-center align-items-center p-4"
            style={{ minHeight: 420 }}
          >
            <img
              src={product.image}
              alt={product.name}
              style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
            />
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div style={{ color: "#7d7d7d", fontWeight: 600, marginBottom: 8 }}>
            {product.brand} • {product.category}
          </div>
          <h1 style={{ fontWeight: 700, lineHeight: 1.3 }}>{product.name}</h1>
          <div style={{ color: "#f76c85", fontSize: 32, fontWeight: 800, marginTop: 16 }}>
            {formatVnd(product.price)}
          </div>

          <p style={{ color: "#4f4f4f", lineHeight: 1.8, marginTop: 24 }}>
            {productDetails.description}
          </p>

          <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
            <span style={{ fontWeight: 600 }}>Số lượng</span>
            <div className="d-flex align-items-center border rounded-3 overflow-hidden">
              <button
                type="button"
                className="btn btn-light border-0"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                -
              </button>
              <span style={{ minWidth: 48, textAlign: "center", fontWeight: 700 }}>
                {quantity}
              </span>
              <button
                type="button"
                className="btn btn-light border-0"
                onClick={() => setQuantity((prev) => prev + 1)}
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-lg mt-4"
            style={{ background: "#f76c85", color: "#fff", paddingInline: 32 }}
            onClick={() => addToCart(product, quantity)}
          >
            Thêm vào giỏ hàng
          </button>

          <div className="row g-3 mt-4">
            <div className="col-12">
              <div className="bg-white border rounded-4 p-4">
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>Thông tin sản phẩm</h3>
                <div className="mt-3" style={{ lineHeight: 1.9 }}>
                  <div><strong>Thương hiệu:</strong> {product.brand}</div>
                  <div><strong>Danh mục:</strong> {product.category}</div>
                  <div><strong>Xuất xứ:</strong> {productDetails.origin}</div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="bg-white border rounded-4 p-4">
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>Thành phần</h3>
                <p className="mb-0 mt-3" style={{ lineHeight: 1.8 }}>
                  {productDetails.ingredients}
                </p>
              </div>
            </div>

            <div className="col-12">
              <div className="bg-white border rounded-4 p-4">
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>Hướng dẫn sử dụng</h3>
                <p className="mb-0 mt-3" style={{ lineHeight: 1.8 }}>
                  {productDetails.usage}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-5">
          <h2 style={{ fontWeight: 700 }}>Có thể bạn cũng thích</h2>
          <div className="row g-4 mt-1">
            {relatedProducts.map((item) => (
              <div key={item.id} className="col-12 col-sm-6 col-lg-3">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
