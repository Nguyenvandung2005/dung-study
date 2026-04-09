import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "./CartConText"; // Đảm bảo đúng tên file CartContext (thường không viết hoa chữ T)


function formatVnd(value) {
    return `${value.toLocaleString("vi-VN")}₫`;
}

export default function ProductCard({ product }) {
    const { addToCart } = useCart();

    return (
        <div className="card h-100 product-card-hover" style={{ borderRadius: 12, overflow: "hidden" }}>
            <Link
                to={`/product/${product.id}`}
                style={{ textDecoration: "none", color: "inherit", flex: 1, display: "flex", flexDirection: "column" }}
                onClick={() => window.scrollTo(0, 0)}
            >
                <div style={{ background: "#fff", padding: 12, display: "flex", justifyContent: "center" }}>
                    <img
                        src={product.image}
                        alt={product.name}
                        style={{ width: 160, height: 160, objectFit: "contain" }}
                    />
                </div>

                <div className="card-body d-flex flex-column pb-0" style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                        {product.brand}
                    </div>

                    <div className="card-title product-name-clamp" style={{ fontWeight: 600, lineHeight: 1.4, fontSize: "0.95rem" }}>
                        {product.name}
                    </div>

                    <div style={{ marginTop: "auto", paddingTop: 12, marginBottom: 12, fontWeight: 800, color: "#f76c85", fontSize: "1.1rem" }}>
                        {formatVnd(product.price)}
                    </div>
                </div>
            </Link>

            <div className="p-3 pt-0 mt-auto">
                <button
                    className="btn w-100"
                    style={{ background: "#f76c85", color: "white", fontWeight: 600 }}
                    onClick={() => {
                        addToCart(product, 1);
                        alert(`Đã thêm ${product.name} vào giỏ hàng!`);
                    }}
                >
                    Thêm vào giỏ
                </button>
            </div>
        </div>
    );
}