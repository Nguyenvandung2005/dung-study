import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useCart } from "../components/CartConText"; // Đã sửa tên file ConText thành Context cho chuẩn
import useFetch from "../hooks/useFetch";

function formatVnd(value) {
    return `${value.toLocaleString("vi-VN")}₫`;
}

export default function ProductDetailPage() {
    const { id } = useParams();
    const { addToCart } = useCart();

    // 1. Lấy dữ liệu sản phẩm hiện tại từ API theo ID
    const { data: product, loading, error } = useFetch(`http://localhost:3000/products/${id}`);

    // 2. Lấy toàn bộ danh sách để lọc "Sản phẩm liên quan"
    const { data: allProducts } = useFetch("http://localhost:3000/products");

    const [quantity, setQuantity] = useState(1);

    // 3. Logic lọc sản phẩm liên quan (Sử dụng useMemo để tối ưu)
    const relatedProducts = useMemo(() => {
        if (!allProducts || !product) return [];
        return allProducts
            .filter((p) => p.category === product.category && p.id !== product.id)
            .slice(0, 4);
    }, [allProducts, product]);

    const handleDecrease = () => {
        if (quantity > 1) setQuantity(quantity - 1);
    };

    const handleIncrease = () => {
        setQuantity(quantity + 1);
    };

    // Xử lý trạng thái đang tải
    if (loading) return <div className="container py-5 text-center"><h4>Đang tải chi tiết sản phẩm...</h4></div>;

    // Xử lý lỗi hoặc không tìm thấy sản phẩm
    if (error || !product || Object.keys(product).length === 0) {
        return (
            <div className="container text-center" style={{ marginTop: 100 }}>
                <h2>Oops! Không tìm thấy sản phẩm.</h2>
                <Link to="/bo-suu-tap" className="btn mt-3" style={{ background: "#f76c85", color: "white" }}>
                    Quay lại bộ sưu tập
                </Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ marginTop: 32, marginBottom: 80 }}>
            {/* NÚT QUAY LẠI */}
            <div className="mb-4">
                <Link to="/bo-suu-tap" className="text-decoration-none text-secondary" style={{ fontWeight: 500 }}>
                    &larr; Quay lại danh sách
                </Link>
            </div>

            {/* PHẦN 1: THÔNG TIN CƠ BẢN SẢN PHẨM */}
            <div className="row g-5">
                <div className="col-12 col-md-5">
                    <div style={{ background: "#fff", padding: 32, borderRadius: 16, border: "1px solid #eaeaea", display: "flex", justifyContent: "center" }}>
                        <img src={product.image} alt={product.name} style={{ width: "100%", maxWidth: 350, objectFit: "contain" }} />
                    </div>
                </div>

                <div className="col-12 col-md-7 d-flex flex-column justify-content-center">
                    <div style={{ fontSize: 14, color: "#6c757d", marginBottom: 8, fontWeight: 500 }}>
                        {product.brand} • {product.category}
                    </div>
                    <h1 style={{ fontWeight: 700, fontSize: "1.8rem", marginBottom: 16 }}>{product.name}</h1>
                    <h2 style={{ color: "#f76c85", fontWeight: 800, fontSize: "1.8rem" }}>{formatVnd(product.price)}</h2>
                    <hr style={{ margin: "24px 0", borderColor: "#eaeaea" }} />
                    <p style={{ color: "#4a4a4a", lineHeight: 1.7 }}>{product.description}</p>

                    <div className="d-flex flex-column align-items-start gap-4" style={{ marginTop: 24 }}>
                        <div className="d-flex align-items-center gap-3">
                            <p style={{ margin: 0, fontWeight: 500 }}>Số lượng:</p>
                            <div className="d-flex align-items-center" style={{ border: "1px solid #eaeaea", borderRadius: 8, overflow: "hidden" }}>
                                <button
                                    className="btn btn-light"
                                    style={{ border: "none", borderRadius: 0, padding: "10px 16px", fontWeight: "bold" }}
                                    onClick={handleDecrease}
                                    disabled={quantity <= 1}
                                > - </button>
                                <div style={{ width: 50, textAlign: "center", fontWeight: 600 }}>{quantity}</div>
                                <button
                                    className="btn btn-light"
                                    style={{ border: "none", borderRadius: 0, padding: "10px 16px", fontWeight: "bold" }}
                                    onClick={handleIncrease}
                                > + </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-lg"
                            style={{ background: "#f76c85", color: "white", fontWeight: 600, padding: "12px 40px", borderRadius: 8 }}
                            onClick={() => {
                                addToCart(product, quantity);
                                alert(`Đã thêm ${quantity} x ${product.name} vào giỏ hàng!`);
                            }}
                        >
                            Thêm vào giỏ hàng
                        </button>
                    </div>
                </div>
            </div>

            {/* PHẦN 2: THÔNG TIN CHI TIẾT */}
            <div className="mt-5 d-flex flex-column gap-4">
                <div style={{ background: "#fff", borderRadius: 12, padding: "32px", border: "1px solid #eaeaea", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <h4 style={{ fontWeight: 700, color: "#333", marginBottom: 24 }}>Thông số sản phẩm</h4>
                    <table className="table table-bordered mb-0">
                        <tbody>
                            <tr>
                                <td style={{ background: "#fafafa", fontWeight: 500, width: "35%" }}>Thương hiệu</td>
                                <td>{product.brand}</td>
                            </tr>
                            <tr>
                                <td style={{ background: "#fafafa", fontWeight: 500 }}>Xuất xứ</td>
                                <td>{product.origin || "Đang cập nhật"}</td>
                            </tr>
                            <tr>
                                <td style={{ background: "#fafafa", fontWeight: 500 }}>Danh mục</td>
                                <td>{product.category}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ background: "#fff", borderRadius: 12, padding: "32px", border: "1px solid #eaeaea", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <h4 style={{ fontWeight: 700, color: "#333", marginBottom: 24 }}>Thành phần sản phẩm</h4>
                    <ul style={{ color: "#4a4a4a", lineHeight: 1.8 }}>
                        <li>{product.ingredients}</li>
                    </ul>
                </div>

                <div style={{ background: "#fff", borderRadius: 12, padding: "32px", border: "1px solid #eaeaea", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <h4 style={{ fontWeight: 700, color: "#333", marginBottom: 24 }}>Hướng dẫn sử dụng</h4>
                    <p style={{ color: "#4a4a4a", lineHeight: 1.8 }}>{product.usage}</p>
                </div>

                {/* --- PHẦN 3: CÓ THỂ BẠN THÍCH --- */}
                {relatedProducts.length > 0 && (
                    <div style={{ background: "#fff", borderRadius: 12, padding: "32px", border: "1px solid #eaeaea", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 24, color: "#333" }}>Có thể bạn thích</h3>
                        <div className="row g-3">
                            {relatedProducts.map((rp) => (
                                <div key={rp.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
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