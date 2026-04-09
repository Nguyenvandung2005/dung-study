import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";

function formatVnd(value) {
  return `${value.toLocaleString("vi-VN")}₫`;
}

export default function CartPage() {
  const { cartItems, cartTotal, removeFromCart, updateQuantity } = useCart();

  return (
    <section className="container py-4 py-lg-5">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 style={{ fontWeight: 700, marginBottom: 6 }}>Giỏ hàng</h1>
          <div className="text-muted">{cartItems.length} sản phẩm trong giỏ</div>
        </div>

        <Link to="/san-pham" className="text-decoration-none" style={{ color: "#f76c85" }}>
          Tiếp tục mua sắm
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          {cartItems.length === 0 ? (
            <div className="bg-white border rounded-4 p-5 text-center">
              <h3>Giỏ hàng của bạn đang trống</h3>
              <p className="text-muted mb-4">
                Hãy thêm vài sản phẩm yêu thích để tiếp tục mua sắm.
              </p>
              <Link to="/san-pham" className="btn" style={{ background: "#f76c85", color: "#fff" }}>
                Khám phá sản phẩm
              </Link>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white border rounded-4 p-3 p-lg-4">
                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-md-6 d-flex gap-3 align-items-center">
                      <div
                        className="border rounded-3 p-2 bg-white d-flex align-items-center justify-content-center"
                        style={{ width: 90, height: 90 }}
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: 13, color: "#888" }}>{item.product.brand}</div>
                        <div style={{ fontWeight: 700 }}>{item.product.name}</div>
                      </div>
                    </div>

                    <div className="col-6 col-md-2 text-md-center">
                      <div className="text-muted" style={{ fontSize: 13 }}>Đơn giá</div>
                      <div style={{ fontWeight: 700 }}>{formatVnd(item.product.price)}</div>
                    </div>

                    <div className="col-6 col-md-2 text-md-center">
                      <div className="text-muted" style={{ fontSize: 13 }}>Số lượng</div>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        className="form-control text-center mt-1"
                        onChange={(event) => updateQuantity(item.id, event.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-2 text-md-end">
                      <div className="text-muted" style={{ fontSize: 13 }}>Tạm tính</div>
                      <div style={{ fontWeight: 800, color: "#f76c85" }}>
                        {formatVnd(item.product.price * item.quantity)}
                      </div>
                      <button
                        type="button"
                        className="btn btn-link p-0 mt-2"
                        style={{ color: "#888", textDecoration: "none" }}
                        onClick={() => removeFromCart(item.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-12 col-lg-4">
          <div className="bg-white border rounded-4 p-4">
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Tóm tắt đơn hàng</h2>
            <div className="d-flex justify-content-between mt-4">
              <span>Tạm tính</span>
              <strong>{formatVnd(cartTotal)}</strong>
            </div>
            <div className="d-flex justify-content-between mt-2">
              <span>Giảm giá</span>
              <strong>0₫</strong>
            </div>
            <hr />
            <div className="d-flex justify-content-between align-items-end">
              <span style={{ fontWeight: 700 }}>Tổng cộng</span>
              <span style={{ color: "#f76c85", fontSize: 24, fontWeight: 800 }}>
                {formatVnd(cartTotal)}
              </span>
            </div>

            <button
              type="button"
              className="btn w-100 mt-4"
              style={{ background: "#f76c85", color: "#fff" }}
              disabled={cartItems.length === 0}
            >
              Tiến hành đặt hàng
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
