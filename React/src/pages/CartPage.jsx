import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../components/CartConText";

function formatVnd(value) {
    return `${value.toLocaleString("vi-VN")} đ`;
}

export default function CartPage() {
    // Kéo toàn bộ dữ liệu từ kho chung ra xài
    const { cartItems, updateQuantity, removeFromCart } = useCart();

    const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

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
                            <Link to="/bo-suu-tap" className="btn" style={{ background: "#f76c85", color: "#fff" }}>
                                Tiếp tục mua sắm
                            </Link>
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
                                                <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", marginBottom: 4 }}>
                                                    {item.product.brand}
                                                </div>
                                                <Link to={`/product/${item.product.id}`} style={{ textDecoration: "none", color: "#333", fontSize: 14 }}>
                                                    {item.product.name.length > 40 ? item.product.name.substring(0, 40) + "..." : item.product.name}
                                                </Link>
                                            </div>
                                            <div className="d-flex gap-3 mt-2" style={{ fontSize: 13 }}>
                                                <button style={{ border: "none", background: "none", padding: 0, color: "#6c757d" }}>♡ Yêu thích</button>
                                                <button
                                                    style={{ border: "none", background: "none", padding: 0, color: "#6c757d" }}
                                                    onClick={() => removeFromCart(item.id)} // <--- Gọi hàm Xóa
                                                >
                                                    ✕ Xóa
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-3 text-center">
                                        <div style={{ fontWeight: 700 }}>{formatVnd(item.product.price)}</div>
                                        <div style={{ textDecoration: "line-through", color: "#999", fontSize: 13, marginTop: 4 }}>
                                            {formatVnd(item.product.price * 1.3)}
                                        </div>
                                    </div>

                                    <div className="col-2 d-flex justify-content-center">
                                        <input
                                            type="number"
                                            min="1"
                                            className="form-control text-center"
                                            style={{ width: 65, height: 36, padding: "4px 8px" }}
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, e.target.value)} // <--- Gọi hàm Cập nhật SL
                                        />
                                    </div>

                                    <div className="col-2 text-end" style={{ fontWeight: 700 }}>
                                        {formatVnd(item.product.price * item.quantity)}
                                    </div>
                                </div>
                            ))}

                            <div className="d-flex justify-content-between align-items-center mt-4">
                                <Link to="/bo-suu-tap" style={{ textDecoration: "none", color: "#000000", fontWeight: 500 }}>
                                    ◄ Tiếp tục mua hàng
                                </Link>
                                <div className="text-end">
                                    <div style={{ marginBottom: 4 }}>
                                        Tạm tính: <span style={{ fontWeight: 700, color: "#f76c85", fontSize: 18, marginLeft: 8 }}>{formatVnd(totalAmount)}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>(Đã bao gồm VAT)</div>
                                    <button className="btn" style={{ background: "#f76c85", color: "#fff", fontWeight: 600, padding: "8px 24px" }}>
                                        Tiến hành đặt hàng
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* HÓA ĐƠN BÊN PHẢI */}
                <div className="col-12 col-lg-4">
                    <div style={{ borderTop: "3px solid #285430", background: "#fff", padding: "24px 0", marginTop: (cartItems.length > 0 ? "52px" : "0") }}>
                        <h5 style={{ fontWeight: 700, marginBottom: 24 }}>Hóa đơn của bạn</h5>
                        <div className="d-flex justify-content-between mb-3" style={{ color: "#555" }}>
                            <span>Tạm tính:</span><span style={{ fontWeight: 600, color: "#333" }}>{formatVnd(totalAmount)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-4" style={{ color: "#555" }}>
                            <span>Giảm giá:</span><span style={{ fontWeight: 600, color: "#333" }}>0 đ</span>
                        </div>
                        <hr style={{ borderColor: "#eaeaea" }} />
                        <div className="d-flex justify-content-between align-items-end mt-4 mb-2">
                            <span style={{ color: "#333", fontSize: 16 }}>Tổng cộng:</span>
                            <span style={{ fontWeight: 700, color: "#f76c85", fontSize: 20 }}>{formatVnd(totalAmount)}</span>
                        </div>
                        <div className="text-end" style={{ fontSize: 12, color: "#999", marginBottom: 24 }}>(Đã bao gồm VAT)</div>
                        <button
                            className="btn w-100"
                            style={{ background: "#f76c85", color: "#fff", fontWeight: 600, padding: "12px", fontSize: 16 }}
                            disabled={cartItems.length === 0}
                        >
                            Tiến hành đặt hàng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}