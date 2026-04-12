import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";

function formatVnd(value) {
  return `${value.toLocaleString("vi-VN")}₫`;
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const hasDiscount = product.discount && product.discount > 0;
  const originalPrice = hasDiscount
    ? Math.round(product.price / (1 - product.discount / 100))
    : null;

  function handleAdd(e) {
    e.preventDefault();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="pc">
      <Link to={`/san-pham/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        <div className="pc-img-wrap">
          <img src={product.image} alt={product.name} className="pc-img" />
          <div className="pc-shade" />

          {hasDiscount ? (
            <span className="pc-badge pc-badge--sale">-{product.discount}%</span>
          ) : product.isNew ? (
            <span className="pc-badge">Mới</span>
          ) : null}

          <div className="pc-add">+ Thêm vào giỏ</div>
        </div>

        <div className="pc-body">
          <div className="pc-meta">{product.brand} • {product.category}</div>
          <div className="pc-name">{product.name}</div>
          <div className="pc-price-row">
            <span className="pc-price">{formatVnd(product.price)}</span>
            {originalPrice && (
              <span className="pc-old">{formatVnd(originalPrice)}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="pc-foot">
        <button
          className={`pc-btn${added ? " pc-btn--added" : ""}`}
          onClick={handleAdd}
        >
          {added ? "Đã thêm" : "Thêm vào giỏ"}
        </button>
      </div>
    </div>
  );
}
