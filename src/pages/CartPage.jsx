import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import VoucherPopup from "../components/VoucherPopup";
import "../css/HomePage.css";

function formatVnd(value) {
    return `${value.toLocaleString("vi-VN")} đ`;
}

function useVoucher() {
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherInfo, setVoucherInfo] = useState(null);
    const [voucherError, setVoucherError] = useState("");
    const [voucherLoading, setVoucherLoading] = useState(false);

    const applyVoucher = async (totalAmount, code) => {
        const finalCode = (code || voucherCode).trim();
        if (!finalCode) { setVoucherError("Vui lòng nhập mã voucher."); return; }
        setVoucherLoading(true); setVoucherError(""); setVoucherInfo(null);
        try {
            const res = await fetch("/api/vouchers/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: finalCode, totalAmount }),
            });
            const data = await res.json();
            if (!res.ok) setVoucherError(data.message || "Mã voucher không hợp lệ.");
            else { setVoucherInfo(data.voucher); setVoucherCode(finalCode); }
        } catch { setVoucherError("Không thể kết nối server."); }
        finally { setVoucherLoading(false); }
    };

    const removeVoucher = () => { setVoucherInfo(null); setVoucherCode(""); setVoucherError(""); };

    return { voucherCode, setVoucherCode, voucherInfo, voucherError, voucherLoading, applyVoucher, removeVoucher };
}

export default function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, isLoggedIn, login } = useCart();
    const navigate = useNavigate();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showVoucherPopup, setShowVoucherPopup] = useState(false);
    const { voucherCode, setVoucherCode, voucherInfo, voucherError, voucherLoading, applyVoucher, removeVoucher } = useVoucher();

    const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discountAmount = voucherInfo?.discountAmount || 0;
    const finalAmount = Math.max(0, totalAmount - discountAmount);

    const handleCheckout = () => {
        if (isLoggedIn) navigate("/checkout", { state: { voucherInfo } });
        else setShowLoginModal(true);
    };

    const handleLoginSuccess = (userInfo, token) => {
        login(userInfo || {}, token || "");
        setShowLoginModal(false);
        navigate("/checkout", { state: { voucherInfo } });
    };

    const openRegister = () => { setShowLoginModal(false); setShowRegisterModal(true); };
    const openLogin = () => { setShowRegisterModal(false); setShowLoginModal(true); };

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
                            <Link to="/san-pham" className="btn" style={{ background: "#f76c85", color: "#fff" }}>Tiếp tục mua sắm</Link>
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
                                                <Link to={`/san-pham/${item.product.id}`} style={{ textDecoration: "none", color: "#333", fontSize: 14 }}>
                                                    {item.product.name.length > 40 ? item.product.name.substring(0, 40) + "..." : item.product.name}
                                                </Link>
                                            </div>
                                            <button type="button" className="btn p-0 text-muted small text-start mt-2" onClick={() => removeFromCart(item.id)}>✕ Xóa</button>
                                        </div>
                                    </div>
                                    <div className="col-3 text-center fw-bold">{formatVnd(item.product.price)}</div>
                                    <div className="col-2 d-flex justify-content-center">
                                        <input type="number" min="1" className="form-control text-center w-75"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)} />
                                    </div>
                                    <div className="col-2 text-end fw-bold">{formatVnd(item.product.price * item.quantity)}</div>
                                </div>
                            ))}

                            {/* ── Ô nhập voucher ── */}
                            <div style={{ marginTop: 20, padding: "16px 20px", background: "#fff8fb", borderRadius: 12, border: "1px solid #ffe0e8" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>🎟️ Mã giảm giá</div>
                                    {/* Nút xem danh sách voucher */}
                                    <button
                                        onClick={() => setShowVoucherPopup(true)}
                                        style={{ background: "none", border: "none", color: "#ff6b81", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                                    >
                                        Xem mã giảm giá
                                    </button>
                                </div>

                                {voucherInfo ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff0f3", border: "1.5px solid #ff6b81", borderRadius: 8, padding: "10px 14px" }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#ff6b81", fontSize: 14 }}>✅ {voucherInfo.code}</div>
                                            <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>{voucherInfo.title} — Giảm <b style={{ color: "#ff6b81" }}>{formatVnd(voucherInfo.discountAmount)}</b></div>
                                        </div>
                                        <button onClick={removeVoucher}
                                            style={{ background: "none", border: "1px solid #ff6b81", color: "#ff6b81", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                                            Hủy
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <input type="text" placeholder="Nhập mã voucher (VD: PINKY15)"
                                            value={voucherCode}
                                            onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                                            onKeyDown={e => e.key === "Enter" && applyVoucher(totalAmount)}
                                            style={{ flex: 1, padding: "10px 14px", border: `1.5px solid ${voucherError ? "#e53935" : "#ddd"}`, borderRadius: 8, fontSize: 14, outline: "none" }} />
                                        <button onClick={() => applyVoucher(totalAmount)} disabled={voucherLoading}
                                            style={{ background: "#ff6b81", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: voucherLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                                            {voucherLoading ? "..." : "Áp dụng"}
                                        </button>
                                    </div>
                                )}
                                {voucherError && <div style={{ fontSize: 12, color: "#e53935", marginTop: 6 }}>⚠ {voucherError}</div>}
                            </div>

                            {/* Footer */}
                            <div className="d-flex justify-content-between align-items-center mt-4">
                                <Link to="/san-pham" style={{ textDecoration: "none", color: "#000", fontWeight: 500 }}>◄ Tiếp tục mua hàng</Link>
                                <div className="text-end">
                                    {discountAmount > 0 && (
                                        <div style={{ fontSize: 13, color: "#888", marginBottom: 2 }}>
                                            Tạm tính: <span style={{ textDecoration: "line-through" }}>{formatVnd(totalAmount)}</span>
                                            <span style={{ color: "#22c55e", marginLeft: 8 }}>-{formatVnd(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div style={{ marginBottom: 8 }}>
                                        Tổng tiền: <span style={{ fontWeight: 700, color: "#f76c85", fontSize: 18, marginLeft: 8 }}>{formatVnd(finalAmount)}</span>
                                    </div>
                                    <button className="btn" style={{ background: "#f76c85", color: "#fff", fontWeight: 600, padding: "8px 24px" }} onClick={handleCheckout}>
                                        Tiến hành đặt hàng
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Cột phải */}
                <div className="col-12 col-lg-4">
                    <div className="p-4 border-top border-3" style={{ borderColor: "#f76c85", background: "#fff" }}>
                        <h5 className="fw-bold mb-4">Hóa đơn của bạn</h5>
                        <div className="d-flex justify-content-between mb-3">
                            <span>Tạm tính:</span><b>{formatVnd(totalAmount)}</b>
                        </div>
                        {discountAmount > 0 && (
                            <div className="d-flex justify-content-between mb-3" style={{ color: "#22c55e" }}>
                                <span>Giảm giá ({voucherInfo?.code}):</span>
                                <b>-{formatVnd(discountAmount)}</b>
                            </div>
                        )}
                        <hr />
                        <div className="d-flex justify-content-between align-items-end mb-4">
                            <span>Tổng cộng:</span>
                            <span className="fs-4 fw-bold" style={{ color: "#f76c85" }}>{formatVnd(finalAmount)}</span>
                        </div>
                        <button className="btn w-100 py-3 fw-bold" style={{ background: "#f76c85", color: "#fff" }}
                            disabled={cartItems.length === 0} onClick={handleCheckout}>
                            Tiến hành đặt hàng
                        </button>
                    </div>
                </div>
            </div>

            {/* Voucher Popup */}
            <VoucherPopup
                show={showVoucherPopup}
                onClose={() => setShowVoucherPopup(false)}
                totalAmount={totalAmount}
                onSelect={(code) => {
                    setVoucherCode(code);
                    applyVoucher(totalAmount, code);
                }}
            />

            <LoginModal show={showLoginModal} onClose={() => setShowLoginModal(false)}
                onLoginSuccess={handleLoginSuccess} onSwitchToRegister={openRegister} />
            <RegisterModal show={showRegisterModal} onClose={() => setShowRegisterModal(false)}
                onSwitchToLogin={openLogin} />
        </div>
    );
}