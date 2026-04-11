import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useCart } from "../components/CartContext";
import useFetch from "../hooks/useFetch";

function formatVnd(value) {
    return `${value.toLocaleString("vi-VN")}₫`;
}

const TABS = [
    { key: "spec", label: "Thông số" },
    { key: "ingredients", label: "Thành phần" },
    { key: "usage", label: "Hướng dẫn dùng" },
];

export default function ProductDetailPage() {
    const { id } = useParams();
    const { addToCart } = useCart();

    const { data: product, loading, error } = useFetch(`http://localhost:3000/products/${id}`);
    const { data: allProducts } = useFetch("http://localhost:3000/products");

    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState("spec");
    const [added, setAdded] = useState(false);
    const [wished, setWished] = useState(false);

    const relatedProducts = useMemo(() => {
        if (!allProducts || !product) return [];
        return allProducts
            .filter((p) => p.category === product.category && p.id !== product.id)
            .slice(0, 4);
    }, [allProducts, product]);

    // --- LOGIC TÍNH TOÁN GIÁ CẢ & KHUYẾN MÃI ---
    // Lấy phần trăm giảm giá từ database (nếu không có thì mặc định là 0)
    const discount = product?.discount || 0;

    // Tự động tính giá gốc (giá cũ) dựa trên giá bán hiện tại và phần trăm giảm giá
    const oldPrice = product?.oldPrice || product?.originalPrice || (
        discount > 0 ? Math.round(product.price / (1 - discount / 100)) : null
    );

    function handleAddToCart() {
        addToCart(product, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1800);
    }

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border" style={{ color: "#f76c85" }} role="status" />
                <p className="mt-3" style={{ color: "#f76c85", fontWeight: 500 }}>
                    Đang tải sản phẩm...
                </p>
            </div>
        );
    }

    if (error || !product || Object.keys(product).length === 0) {
        return (
            <div className="container text-center" style={{ marginTop: 100 }}>
                <h3 className="mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-secondary mb-4">
                    Sản phẩm này có thể đã được xóa hoặc không tồn tại.
                </p>
                <Link
                    to="/san-pham"
                    style={{
                        background: "#f76c85",
                        color: "#fff",
                        padding: "10px 28px",
                        borderRadius: 8,
                        textDecoration: "none",
                        fontWeight: 500,
                    }}
                >
                    Quay lại bộ sưu tập
                </Link>
            </div>
        );
    }

    return (
        <div style={{ background: "#f6f6f4", minHeight: "100vh", paddingBottom: 80 }}>
            <div className="container" style={{ paddingTop: 28 }}>

                {/* BREADCRUMB */}
                <nav style={{ fontSize: 13, color: "#aaa", marginBottom: 22, display: "flex", alignItems: "center", gap: 7 }}>
                    <Link to="/" style={{ color: "#aaa", textDecoration: "none" }}>Trang chủ</Link>
                    <span>/</span>
                    <Link to="/bo-suu-tap" style={{ color: "#aaa", textDecoration: "none" }}>Bộ sưu tập</Link>
                    <span>/</span>
                    <span style={{ color: "#333" }}>{product.name}</span>
                </nav>

                {/* PHẦN CHÍNH */}
                <div className="row g-4 mb-4">

                    {/* ẢNH */}
                    <div className="col-12 col-md-5">
                        <div style={{
                            background: "#fff",
                            borderRadius: 16,
                            border: "1px solid #ebebeb",
                            padding: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            aspectRatio: "1 / 1",
                            position: "relative" // Thêm relative để gắn badge
                        }}>
                            {/* Hiển thị Nhãn Giảm Giá (Badge) trên ảnh nếu có */}
                            {discount > 0 && (
                                <div style={{
                                    position: "absolute",
                                    top: 16,
                                    right: 16,
                                    background: "#ff4d4f",
                                    color: "#fff",
                                    fontWeight: "bold",
                                    padding: "4px 12px",
                                    borderRadius: "8px",
                                    fontSize: 14,
                                    boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)"
                                }}>
                                    Giảm {discount}%
                                </div>
                            )}
                            <img
                                src={product.image}
                                alt={product.name}
                                style={{ width: "100%", maxWidth: 300, objectFit: "contain" }}
                            />
                        </div>
                    </div>

                    {/* THÔNG TIN */}
                    <div className="col-12 col-md-7">
                        <div style={{
                            background: "#fff",
                            borderRadius: 16,
                            border: "1px solid #ebebeb",
                            padding: "28px 32px",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                        }}>
                            {/* Brand + Category */}
                            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                                <span style={{
                                    background: "#fbeaf0", color: "#c2456a",
                                    fontSize: 11, fontWeight: 600,
                                    padding: "3px 11px", borderRadius: 20,
                                    letterSpacing: ".3px",
                                }}>
                                    {product.brand}
                                </span>
                                <span style={{
                                    background: "#f2f2f2", color: "#777",
                                    fontSize: 11, fontWeight: 500,
                                    padding: "3px 11px", borderRadius: 20,
                                }}>
                                    {product.category}
                                </span>
                            </div>

                            {/* Tên */}
                            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#111", lineHeight: 1.4, marginBottom: 14 }}>
                                {product.name}
                            </h1>

                            {/* GIÁ & KHUYẾN MÃI */}
                            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
                                <span style={{ fontSize: 28, fontWeight: 800, color: "#f76c85" }}>
                                    {formatVnd(product.price)}
                                </span>

                                {/* Giá Gạch Ngang (Nếu có giảm giá) */}
                                {oldPrice && discount > 0 && (
                                    <span style={{ fontSize: 15, color: "#a0a0a0", textDecoration: "line-through", fontWeight: 500 }}>
                                        {formatVnd(oldPrice)}
                                    </span>
                                )}

                                {/* Nhãn -% Nhỏ bên cạnh giá */}
                                {discount > 0 && (
                                    <span style={{
                                        background: "#fff3e0", color: "#bf5000",
                                        fontSize: 12, fontWeight: 700,
                                        padding: "4px 10px", borderRadius: "6px",
                                    }}>
                                        -{discount}%
                                    </span>
                                )}
                            </div>

                            <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "0 0 18px" }} />

                            {/* Mô tả */}
                            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, marginBottom: 24 }}>
                                {product.description}
                            </p>

                            {/* Số lượng */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 12, color: "#aaa", fontWeight: 500, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".6px" }}>
                                    Số lượng
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                    <div style={{
                                        display: "flex", alignItems: "center",
                                        border: "1px solid #e8e8e8", borderRadius: 9,
                                        overflow: "hidden", width: "fit-content",
                                    }}>
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            disabled={quantity <= 1}
                                            style={{
                                                width: 40, height: 40,
                                                background: "#fafafa", border: "none",
                                                cursor: quantity <= 1 ? "not-allowed" : "pointer",
                                                fontSize: 18, color: quantity <= 1 ? "#ccc" : "#333",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                transition: "background .15s",
                                            }}
                                        >−</button>
                                        <div style={{ width: 48, textAlign: "center", fontWeight: 700, fontSize: 15 }}>
                                            {quantity}
                                        </div>
                                        <button
                                            onClick={() => setQuantity(q => q + 1)}
                                            style={{
                                                width: 40, height: 40,
                                                background: "#fafafa", border: "none",
                                                cursor: "pointer", fontSize: 18, color: "#333",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                transition: "background .15s",
                                            }}
                                        >+</button>
                                    </div>

                                    <span style={{ fontSize: 12, color: "#4caf50", fontWeight: 500 }}>
                                        Còn hàng
                                    </span>
                                </div>
                            </div>

                            {/* Nút hành động */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 20 }}>
                                <button
                                    onClick={handleAddToCart}
                                    style={{
                                        background: added ? "#4caf50" : "#f76c85",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 10,
                                        padding: "13px 0",
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "background .2s",
                                        letterSpacing: ".2px",
                                    }}
                                >
                                    {added ? "Đã thêm vào giỏ ✓" : "Thêm vào giỏ hàng"}
                                </button>
                                <button
                                    onClick={() => setWished(w => !w)}
                                    style={{
                                        background: wished ? "#fbeaf0" : "#fafafa",
                                        border: "1px solid #e8e8e8",
                                        borderRadius: 10,
                                        padding: "0 16px",
                                        cursor: "pointer",
                                        fontSize: 20,
                                        color: wished ? "#f76c85" : "#ccc",
                                        transition: "all .2s",
                                    }}
                                >
                                    {wished ? "♥" : "♡"}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

                {/* TABS THÔNG TIN */}
                <div style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: "1px solid #ebebeb",
                    overflow: "hidden",
                    marginBottom: 16,
                }}>
                    <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
                        {TABS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                style={{
                                    padding: "14px 24px",
                                    fontSize: 13, fontWeight: 600,
                                    background: "none", border: "none",
                                    borderBottom: activeTab === key ? "2px solid #f76c85" : "2px solid transparent",
                                    color: activeTab === key ? "#f76c85" : "#aaa",
                                    cursor: "pointer",
                                    transition: "color .15s",
                                    letterSpacing: ".2px",
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: "26px 32px" }}>
                        {activeTab === "spec" && (
                            <div>
                                {[
                                    ["Thương hiệu", product.brand],
                                    ["Xuất xứ", product.origin || "Đang cập nhật"],
                                    ["Danh mục", product.category],
                                ].map(([k, v]) => (
                                    <div key={k} style={{
                                        display: "flex", alignItems: "flex-start",
                                        padding: "12px 0",
                                        borderBottom: "1px solid #f6f6f4",
                                    }}>
                                        <span style={{ width: 140, fontSize: 13, color: "#aaa", flexShrink: 0 }}>{k}</span>
                                        <span style={{ fontSize: 13, color: "#111", fontWeight: 600 }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === "ingredients" && (
                            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.85, margin: 0 }}>
                                {product.ingredients}
                            </p>
                        )}
                        {activeTab === "usage" && (
                            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.85, margin: 0 }}>
                                {product.usage}
                            </p>
                        )}
                    </div>
                </div>

                {/* SẢN PHẨM LIÊN QUAN */}
                {relatedProducts.length > 0 && (
                    <div style={{
                        background: "#fff",
                        borderRadius: 16,
                        border: "1px solid #ebebeb",
                        padding: "28px 32px",
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: "#111", letterSpacing: ".2px" }}>
                            Có thể bạn thích
                        </h3>
                        <div className="row g-3">
                            {relatedProducts.map((rp) => (
                                <div key={rp.id} className="col-12 col-sm-6 col-lg-3">
                                    <ProductCard product={rp} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}