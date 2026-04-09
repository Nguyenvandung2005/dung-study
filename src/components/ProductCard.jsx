import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";

function formatVnd(value) {
  return `${value.toLocaleString("vi-VN")}₫`;
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <div
      className="card h-100"
      style={{ borderRadius: 12, overflow: "hidden" }}
      title={product.name}
    >
      <Link
        to={`/san-pham/${product.id}`}
        style={{ color: "inherit", textDecoration: "none" }}
      >
        <div
          style={{
            background: "#fff",
            padding: 12,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            style={{ width: 160, height: 160, objectFit: "contain" }}
          />
        </div>

        <div className="card-body d-flex flex-column">
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
            {product.brand} • {product.category}
          </div>

          <div className="card-title" style={{ fontWeight: 600, lineHeight: 1.25 }}>
            {product.name}
          </div>

          <div style={{ marginTop: 10, fontWeight: 800, color: "#f76c85" }}>
            {formatVnd(product.price)}
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3 mt-auto">
        <button
          type="button"
          className="btn w-100"
          style={{ background: "#f76c85", color: "white" }}
          onClick={() => addToCart(product, 1)}
        >
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );
}
