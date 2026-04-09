import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../components/CartConText";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";

function formatVnd(value) {
    return `${value.toLocaleString("vi-VN")} đ`;
}

export default function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, isLoggedIn, login } = useCart();
    const navigate = useNavigate();

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    const handleCheckout = () => {
        if (isLoggedIn) {
            navigate("/checkout");
        } else {
            setShowLoginModal(true);
        }
    };

    const handleLoginSuccess = () => {
        login();
        setShowLoginModal(false);
        navigate("/checkout");
    };

    const openRegister = () => {
        setShowLoginModal(false);
        setShowRegisterModal(true);
    };

    const openLogin = () => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
    };

    return (
        <div className="container" style={{ marginTop: 24, marginBottom: 80 }}>
            <div style={{ fontSize: 14, marginBottom: 16 }}>
                <Link to="/" style={{ textDecoration: "none", color: "#6c757d" }}>Trang chủ</Link>
                <span style={{ margin: "0 8px", color: "#6c757d" }}>{'>'}</span>
                <span style={{ color: "#333" }}>Giỏ hàng</span>
            </div>

            <h3 style={{ fontWeight: 400, marginBottom: 24, fontSize: 24 }}>
                Giỏ hàng <span style={{ color: "#6c757d", fontSize: 20 }}>({cartItems.length} sản phẩm)</span>
            </h3>

            <div className="row g-4">
                <div className="col-12 col-lg-8">
                    {cartItems.length === 0 ? (
                        <div className="text-center p-5 bg-light rounded">
                            <h5 className="text-muted mb-3">Giỏ hàng của bạn đang trống</h5>
                            <Link to="/" className="btn" style={{ background: "#f76c85", color: "#fff" }}>Tiếp tục mua sắm</Link>
                        </div>
                    ) : (
                        <>
                            <div className="row align-items-center py-3 mb-2" style={{ background: "#f8f9fa", fontWeight: 500, fontSize: 14, color: "#333" }}>
                                <div className="col-5">Sản phẩm</div>
                                <div className="col-3 text-center">Giá tiền</div>
                                <div className="col-2 text-center">Số lượng</div>
                                <div className="col-2 text-end">Thành tiền</div>
                            </div>

                            {cartItems.map((item) => (
                                <div key={item.id} className="row align-items-center py-4" style={{ borderBottom: "1px solid #eaeaea" }}>
                                    <div className="col-5 d-flex gap-3">
                                        <div style={{ width: 80, height: 80, flexShrink: 0, border: "1px solid #eaeaea", padding: 4, background: "#fff" }}>
                                            <img src={item.product.image} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                        </div>
                                        <div className="d-flex flex-column justify-content-between py-1">
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", marginBottom: 4 }}>{item.product.brand}</div>
                                                <Link to={`/product/${item.product.id}`} style={{ textDecoration: "none", color: "#333", fontSize: 14 }}>
                                                    {item.product.name.length > 40 ? item.product.name.substring(0, 40) + "..." : item.product.name}
                                                </Link>
                                            </div>
                                            <button className="btn p-0 text-muted small text-start mt-2" onClick={() => removeFromCart(item.id)}>✕ Xóa</button>
                                        </div>
                                    </div>
                                    <div className="col-3 text-center fw-bold">{formatVnd(item.product.price)}</div>
                                    <div className="col-2 d-flex justify-content-center">
                                        {/* ✅ FIX: Parse sang số nguyên, fallback về 1 nếu giá trị không hợp lệ */}
                                        <input
                                            type="number"
                                            min="1"
                                            className="form-control text-center w-75"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <div className="col-2 text-end fw-bold">{formatVnd(item.product.price * item.quantity)}</div>
                                </div>
                            ))}

                            <div className="d-flex justify-content-between align-items-center mt-4">
                                <Link to="/" style={{ textDecoration: "none", color: "#000", fontWeight: 500 }}>◄ Tiếp tục mua hàng</Link>
                                <div className="text-end">
                                    <div style={{ marginBottom: 4 }}>
                                        Tạm tính: <span style={{ fontWeight: 700, color: "#f76c85", fontSize: 18, marginLeft: 8 }}>{formatVnd(totalAmount)}</span>
                                    </div>
                                    <button className="btn" style={{ background: "#f76c85", color: "#fff", fontWeight: 600, padding: "8px 24px" }} onClick={handleCheckout}>
                                        Tiến hành đặt hàng
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="col-12 col-lg-4">
                    <div className="p-4 border-top border-3" style={{ borderColor: "#285430", background: "#fff" }}>
                        <h5 className="fw-bold mb-4">Hóa đơn của bạn</h5>
                        <div className="d-flex justify-content-between mb-3">
                            <span>Tạm tính:</span><b>{formatVnd(totalAmount)}</b>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between align-items-end mb-4">
                            <span>Tổng cộng:</span><span className="fs-4 fw-bold" style={{ color: "#f76c85" }}>{formatVnd(totalAmount)}</span>
                        </div>
                        <button
                            className="btn w-100 py-3 fw-bold"
                            style={{ background: "#f76c85", color: "#fff" }}
                            disabled={cartItems.length === 0}
                            onClick={handleCheckout}
                        >
                            Tiến hành đặt hàng
                        </button>
                    </div>
                </div>
            </div>

            <LoginModal
                show={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={openRegister}
            />
            <RegisterModal
                show={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSwitchToLogin={openLogin}
            />
        </div>
    );
}