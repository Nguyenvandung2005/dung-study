import React, { useState } from "react";
import { useCart } from "../components/CartConText";
import { useNavigate } from "react-router-dom";

function formatVnd(value) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    note: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ FIX: Bỏ thẻ <form> và onSubmit, dùng onClick + validate thủ công để tránh reload trang
  const handleOrder = () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    console.log("Dữ liệu đơn hàng:", { customer: formData, items: cartItems, total: totalAmount });
    alert("Chúc mừng! Bạn đã đặt hàng thành công tại Hasaki Clone.");
    // Nếu CartContext có hàm clearCart thì gọi để xóa giỏ sau khi đặt hàng
    if (typeof clearCart === "function") clearCart();
    navigate("/");
  };

  return (
    <div className="container" style={{ marginTop: 40, marginBottom: 80 }}>
      <h3 className="mb-4">Thanh toán đơn hàng</h3>
      <div className="row">
        {/* CỘT TRÁI: FORM THÔNG TIN */}
        <div className="col-md-7">
          <div className="card p-4 shadow-sm">
            <h5 className="mb-3">Thông tin giao hàng</h5>

            {/* ✅ FIX: Dùng div thay cho <form> để tránh reload trang */}
            <div>
              <div className="mb-3">
                <label className="form-label">Họ tên người nhận <span className="text-danger">*</span></label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập họ tên"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Số điện thoại <span className="text-danger">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Địa chỉ chi tiết <span className="text-danger">*</span></label>
                <textarea
                  name="address"
                  className="form-control"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                ></textarea>
              </div>

              {/* ✅ FIX: Thêm input cho field `note` vốn bị khai báo trong formData nhưng bị thiếu trong UI */}
              <div className="mb-3">
                <label className="form-label">Ghi chú đơn hàng</label>
                <textarea
                  name="note"
                  className="form-control"
                  rows="2"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Ghi chú thêm cho đơn hàng (không bắt buộc)"
                ></textarea>
              </div>

              <button
                className="btn w-100 mt-3"
                style={{ background: "#f76c85", color: "#fff", fontWeight: 600, padding: "12px" }}
                onClick={handleOrder}
                disabled={cartItems.length === 0}
              >
                XÁC NHẬN ĐẶT HÀNG
              </button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
        <div className="col-md-5">
          <div className="card p-4 bg-light">
            <h5>Đơn hàng của bạn ({cartItems.length})</h5>
            <hr />
            {cartItems.map((item) => (
              <div key={item.id} className="d-flex justify-content-between mb-2 small">
                <span>{item.product.name} x {item.quantity}</span>
                <span>{formatVnd(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <hr />
            <div className="d-flex justify-content-between fw-bold" style={{ color: "#f76c85" }}>
              <span>TỔNG CỘNG:</span>
              <span>{formatVnd(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}