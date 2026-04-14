import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import "../css/HomePage.css";

//Format số tiền sang định dạng VNĐ 
function formatVnd(value) {
    return `${value.toLocaleString("vi-VN")} đ`;
}

export default function CartPage() {
    // Lấy dữ liệu giỏ hàng và các hàm xử lý từ CartContext
    const { cartItems, updateQuantity, removeFromCart, isLoggedIn, login } = useCart();
    const navigate = useNavigate();

    // State điều khiển hiển thị modal đăng nhập / đăng ký
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    // Tính tổng tiền: cộng (giá × số lượng) của từng sản phẩm 
    const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    //  Xử lý khi bấm "Tiến hành đặt hàng" 
    // Nếu đã đăng nhập → vào /checkout, chưa đăng nhập → mở modal login
    const handleCheckout = () => {
        if (isLoggedIn) {
            navigate("/checkout");
        } else {
            setShowLoginModal(true);
        }
    };

    //  Sau khi đăng nhập thành công trong modal 
    // Lưu thông tin user vào context rồi chuyển thẳng sang trang checkout
    const handleLoginSuccess = (userInfo, token) => {
        login(userInfo || {}, token || "");
        setShowLoginModal(false);
        navigate("/checkout");
    };

    //  Chuyển đổi qua lại giữa modal Login ↔ Register
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

            {/* Breadcrumb: Trang chủ > Giỏ hàng */}
            <div style={{ fontSize: 14, marginBottom: 16 }}>
                <Link to="/" style={{ textDecoration: "none", color: "#6c757d" }}>Trang chủ</Link>
                <span style={{ margin: "0 8px", color: "#6c757d" }}>{'>'}</span>
                <span style={{ color: "#333" }}>Giỏ hàng</span>
            </div>

            {/* Tiêu đề + số lượng sản phẩm trong giỏ */}
            <h3 style={{ fontWeight: 400, marginBottom: 24, fontSize: 24 }}>
                Giỏ hàng <span style={{ color: "#6c757d", fontSize: 20 }}>({cartItems.length} sản phẩm)</span>
            </h3>

            {/* Layout 2 cột: danh sách sản phẩm (8) | tóm tắt hóa đơn (4) */}
            <div className="row g-4">

                {/* ── Cột trái: danh sách sản phẩm trong giỏ ────────────────── */}
                <div className="col-12 col-lg-8">
                    {cartItems.length === 0 ? (
                        // Giỏ trống → hiển thị thông báo + nút mua tiếp
                        <div className="text-center p-5 bg-light rounded">
                            <h5 className="text-muted mb-3">Giỏ hàng của bạn đang trống</h5>
                            <Link to="/san-pham" className="btn" style={{ background: "#f76c85", color: "#fff" }}>
                                Tiếp tục mua sắm
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Header bảng sản phẩm */}
                            <div className="row align-items-center py-3 mb-2"
                                style={{ background: "#f8f9fa", fontWeight: 500, fontSize: 14, color: "#333" }}>
                                <div className="col-5">Sản phẩm</div>
                                <div className="col-3 text-center">Giá tiền</div>
                                <div className="col-2 text-center">Số lượng</div>
                                <div className="col-2 text-end">Thành tiền</div>
                            </div>

                            {/* Danh sách từng sản phẩm trong giỏ */}
                            {cartItems.map((item) => (
                                <div key={item.id} className="row align-items-center py-4"
                                    style={{ borderBottom: "1px solid #eaeaea" }}>

                                    {/* Cột sản phẩm: ảnh + tên + nút xóa */}
                                    <div className="col-5 d-flex gap-3">
                                        {/* Ảnh thu nhỏ */}
                                        <div style={{ width: 80, height: 80, flexShrink: 0, border: "1px solid #eaeaea", padding: 4, background: "#fff" }}>
                                            <img src={item.product.image} alt={item.product.name}
                                                style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                        </div>

                                        {/* Thương hiệu + tên (cắt bớt nếu dài hơn 40 ký tự) + nút xóa */}
                                        <div className="d-flex flex-column justify-content-between py-1">
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", marginBottom: 4 }}>
                                                    {item.product.brand}
                                                </div>
                                                <Link to={`/san-pham/${item.product.id}`}
                                                    style={{ textDecoration: "none", color: "#333", fontSize: 14 }}>
                                                    {item.product.name.length > 40
                                                        ? item.product.name.substring(0, 40) + "..."
                                                        : item.product.name}
                                                </Link>
                                            </div>
                                            {/* Xóa sản phẩm khỏi giỏ */}
                                            <button
                                                type="button"
                                                className="cart-remove-btn mt-2"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <span className="cart-remove-btn__icon">✕</span>
                                                Xóa sản phẩm
                                            </button>
                                        </div>
                                    </div>

                                    {/* Đơn giá */}
                                    <div className="col-3 text-center fw-bold">{formatVnd(item.product.price)}</div>

                                    {/* Input số lượng — thay đổi trực tiếp, tối thiểu là 1 */}
                                    <div className="col-2 d-flex justify-content-center">
                                        <input
                                            type="number"
                                            min="1"
                                            className="form-control text-center w-75"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                        />
                                    </div>

                                    {/* Thành tiền = đơn giá × số lượng */}
                                    <div className="col-2 text-end fw-bold">
                                        {formatVnd(item.product.price * item.quantity)}
                                    </div>
                                </div>
                            ))}

                            {/* Footer: nút mua tiếp + tạm tính + nút checkout */}
                            <div className="d-flex justify-content-between align-items-center mt-4">
                                <Link to="/san-pham" style={{ textDecoration: "none", color: "#000", fontWeight: 500 }}>
                                    ◄ Tiếp tục mua hàng
                                </Link>
                                <div className="text-end">
                                    <div style={{ marginBottom: 4 }}>
                                        Tạm tính: <span style={{ fontWeight: 700, color: "#f76c85", fontSize: 18, marginLeft: 8 }}>{formatVnd(totalAmount)}</span>
                                    </div>
                                    <button className="btn"
                                        style={{ background: "#f76c85", color: "#fff", fontWeight: 600, padding: "8px 24px" }}
                                        onClick={handleCheckout}>
                                        Tiến hành đặt hàng
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Cột phải: tóm tắt hóa đơn ───────────────────────────── */}
                <div className="col-12 col-lg-4">
                    <div className="p-4 border-top border-3" style={{ borderColor: "#285430", background: "#fff" }}>
                        <h5 className="fw-bold mb-4">Hóa đơn của bạn</h5>

                        {/* Tạm tính */}
                        <div className="d-flex justify-content-between mb-3">
                            <span>Tạm tính:</span><b>{formatVnd(totalAmount)}</b>
                        </div>
                        <hr />

                        {/* Tổng cộng (hiện tại = tạm tính, chưa có phí ship/voucher) */}
                        <div className="d-flex justify-content-between align-items-end mb-4">
                            <span>Tổng cộng:</span>
                            <span className="fs-4 fw-bold" style={{ color: "#f76c85" }}>{formatVnd(totalAmount)}</span>
                        </div>

                        {/* Nút đặt hàng — disable khi giỏ trống */}
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

            {/*  Modal đăng nhập (hiện khi chưa login mà bấm checkout) */}
            <LoginModal
                show={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={openRegister}  // chuyển sang modal đăng ký
            />

            {/*  Modal đăng ký  */}
            <RegisterModal
                show={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSwitchToLogin={openLogin}  // chuyển lại modal đăng nhập
            />
        </div>
    );
}
