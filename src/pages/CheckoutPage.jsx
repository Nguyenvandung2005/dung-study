import React, { useState, useEffect } from "react";
import { useCart } from "../components/CartContext";
import { useNavigate, useLocation } from "react-router-dom";
import AddressModal from "../components/AddressModal";
import PaymentModal from "../components/PaymentModal";
import VoucherPopup from "../components/VoucherPopup";

function formatVnd(value) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

function getDeliveryDates() {
  const days = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  const now = new Date();
  const fast = new Date(now); fast.setDate(now.getDate() + 1);
  const normal = new Date(now); normal.setDate(now.getDate() + 2);
  return {
    fast: { label: `${days[fast.getDay()]}. Trước 10h, ${fast.getDate()}/${fast.getMonth() + 1}`, sub: "NowFree Giao Nhanh 2H", tag: "Trợ giá 100k", price: 0 },
    normal: { label: `${days[normal.getDay()]}. ${normal.getDate()}/${normal.getMonth() + 1}`, sub: "Giao trong 48 giờ", price: 0 },
  };
}

const PAYMENT_METHODS = [
  { id: "cod", icon: "💵", label: "Thanh toán khi nhận hàng (COD)" },
  { id: "bank", icon: "🏦", label: "Chuyển khoản ngân hàng" },
  { id: "momo", icon: "💜", label: "Ví MoMo" },
  { id: "vnpay", icon: "💳", label: "VNPay" },
];

// ── Hook validate voucher ──
function useVoucher(initialVoucher = null) {
  const [voucherCode, setVoucherCode] = useState(initialVoucher?.code || "");
  const [voucherInfo, setVoucherInfo] = useState(initialVoucher || null);
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

export default function CheckoutPage() {
  const { cartItems, clearCart, addresses, addAddress, updateAddress, getDefaultAddress, currentUser } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận voucherInfo từ CartPage nếu có
  const { voucherCode, setVoucherCode, voucherInfo, voucherError, voucherLoading, applyVoucher, removeVoucher } =
    useVoucher(location.state?.voucherInfo || null);

  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = voucherInfo?.discountAmount || 0;
  const finalAmount = Math.max(0, totalAmount - discountAmount);
  const delivery = getDeliveryDates();

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddressList, setShowAddressList] = useState(false);
  const [editData, setEditData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [showPaymentList, setShowPaymentList] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState("fast");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVoucherPopup, setShowVoucherPopup] = useState(false);

  useEffect(() => {
    const def = getDefaultAddress();
    if (def) setSelectedAddressId(def.id);
    else setShowAddressModal(true);
  }, []);

  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const def = getDefaultAddress();
      if (def) setSelectedAddressId(def.id);
    }
  }, [addresses]);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId) || null;
  const selectedPayment = PAYMENT_METHODS.find(p => p.id === paymentMethod);

  const handleSaveAddress = (data) => {
    if (editData) { updateAddress(editData.id, data); setSelectedAddressId(editData.id); }
    else { const newAddr = addAddress(data); setSelectedAddressId(newAddr.id); }
    setShowAddressModal(false);
    setShowAddressList(false);
  };

  // ── Hàm lưu đơn hàng vào MongoDB ──
  const saveOrder = async () => {
    console.log("saveOrder called", { cartItems, selectedAddress, currentUser }); // thêm dòng này
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser?.id || currentUser?.contact || currentUser?.email || "guest",
        userContact: currentUser?.email || currentUser?.contact || "guest",
        items: cartItems.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          image: item.product.image,
          price: item.product.price,
          quantity: item.quantity,
        })),
        address: selectedAddress,
        paymentMethod,
        deliveryOption,
        totalAmount,
        discountAmount,
        finalAmount,
        voucherCode: voucherInfo?.code || null,
        note,
      }),
    });
  };

  const handleOrder = async () => {
    console.log("handleOrder called", { selectedAddress, paymentMethod });
    if (!selectedAddress) { setShowAddressModal(true); return; }
    if (paymentMethod === "cod") {
      setLoading(true);
      try {
        await saveOrder();
        setLoading(false);
        alert(`🎉 Đặt hàng thành công!\nGiao đến: ${selectedAddress.fullName} - ${selectedAddress.phone}\n${selectedAddress.street}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}${voucherInfo ? `\nVoucher: ${voucherInfo.code} (-${formatVnd(discountAmount)})` : ""}\nTổng thanh toán: ${formatVnd(finalAmount)}`);
        clearCart?.();
        navigate("/");
      } catch {
        setLoading(false);
        alert("Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
      }
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = async () => {
    try { await saveOrder(); } catch { console.error("Lỗi lưu đơn hàng"); }
    clearCart?.();
    navigate("/");
  };

  const card = { background: "#fff", borderRadius: 12, border: "1px solid #e8e8e8", padding: "20px 24px", marginBottom: 12 };
  const sectionTitle = { fontWeight: 700, fontSize: 16, color: "#1a1a1a", margin: 0 };
  const linkBtn = (color = "#ff6b81") => ({ background: "none", border: "none", color, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 });

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingTop: 24, paddingBottom: 60 }}>
      <div style={{ background: "#ff6b81", padding: "14px 0", marginBottom: 24 }}>
        <div className="container" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>Thanh toán</span>
        </div>
      </div>

      <div className="container">
        <div className="row g-4" style={{ alignItems: "flex-start" }}>

          {/* CỘT TRÁI */}
          <div className="col-lg-8">

            {/* Địa chỉ */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: selectedAddress ? 12 : 0 }}>
                <span style={sectionTitle}>Địa chỉ nhận hàng</span>
                <button style={linkBtn()} onClick={() => setShowAddressList(!showAddressList)}>Thay đổi</button>
              </div>
              {selectedAddress ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ background: "#ff6b81", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{selectedAddress.addressType}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{selectedAddress.fullName}</span>
                    <span style={{ color: "#666", fontSize: 14 }}>- {'*'.repeat(selectedAddress.phone.length - 3)}{selectedAddress.phone.slice(-3)}</span>
                  </div>
                  <div style={{ fontSize: 14, color: "#555" }}>{selectedAddress.street}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}</div>
                </div>
              ) : (
                <div onClick={() => setShowAddressModal(true)} style={{ padding: "12px 0", color: "#e65100", cursor: "pointer", fontSize: 14 }}>
                  ⚠️ Chưa có địa chỉ — Bấm để thêm mới
                </div>
              )}
              {showAddressList && (
                <div style={{ marginTop: 14, borderTop: "1px solid #f0f0f0", paddingTop: 14 }}>
                  {addresses.map(addr => (
                    <div key={addr.id} onClick={() => { setSelectedAddressId(addr.id); setShowAddressList(false); }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${addr.id === selectedAddressId ? "#ff6b81" : "#eee"}`, background: addr.id === selectedAddressId ? "#fff0f3" : "#fafafa", marginBottom: 8, cursor: "pointer" }}>
                      <input type="radio" readOnly checked={addr.id === selectedAddressId} style={{ accentColor: "#ff6b81", marginTop: 3 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{addr.fullName} - {addr.phone}
                          {addr.isDefault && <span style={{ marginLeft: 8, background: "#ffe8ec", color: "#ff6b81", fontSize: 11, padding: "1px 6px", borderRadius: 4 }}>Mặc định</span>}
                        </div>
                        <div style={{ fontSize: 13, color: "#666" }}>{addr.street}, {addr.ward}, {addr.district}, {addr.province}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setEditData(addr); setShowAddressModal(true); }}
                        style={{ ...linkBtn("#ff6b81"), fontSize: 12, border: "1px solid #ddd", borderRadius: 6, padding: "3px 10px" }}>Sửa</button>
                    </div>
                  ))}
                  <button onClick={() => { setEditData(null); setShowAddressModal(true); }}
                    style={{ ...linkBtn("#ff6b81"), border: "1.5px dashed #ff6b81", borderRadius: 8, padding: "8px 16px", fontSize: 13, width: "100%" }}>
                    + Thêm địa chỉ mới
                  </button>
                </div>
              )}
            </div>

            {/* Thanh toán */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={sectionTitle}>Hình thức thanh toán</span>
                <button style={linkBtn()} onClick={() => setShowPaymentList(!showPaymentList)}>Thay đổi</button>
              </div>
              {!showPaymentList ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #ff6b81", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff6b81" }} />
                  </div>
                  <span style={{ fontSize: 15 }}>{selectedPayment?.icon}</span>
                  <span style={{ fontSize: 14, color: "#333" }}>{selectedPayment?.label}</span>
                </div>
              ) : (
                <div>
                  {PAYMENT_METHODS.map(pm => (
                    <div key={pm.id} onClick={() => { setPaymentMethod(pm.id); setShowPaymentList(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${paymentMethod === pm.id ? "#ff6b81" : "#eee"}`, background: paymentMethod === pm.id ? "#fff0f3" : "#fff", marginBottom: 8, cursor: "pointer" }}>
                      <input type="radio" readOnly checked={paymentMethod === pm.id} style={{ accentColor: "#ff6b81" }} />
                      <span style={{ fontSize: 18 }}>{pm.icon}</span>
                      <span style={{ fontSize: 14, color: "#333" }}>{pm.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin kiện hàng */}
            <div style={card}>
              <div style={{ marginBottom: 14 }}><span style={sectionTitle}>Thông tin kiện hàng</span></div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {["fast", "normal"].map(opt => (
                  <div key={opt} onClick={() => setDeliveryOption(opt)}
                    style={{ flex: 1, border: `1.5px solid ${deliveryOption === opt ? "#ff6b81" : "#ddd"}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", background: deliveryOption === opt ? "#fff0f3" : "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <input type="radio" readOnly checked={deliveryOption === opt} style={{ accentColor: "#ff6b81" }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#ff6b81" }}>{delivery[opt].label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#555", paddingLeft: 20 }}>
                      {delivery[opt].sub}
                      {opt === "fast" && <span style={{ background: "#ff6b35", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, marginLeft: 6 }}>{delivery.fast.tag}</span>}
                    </div>
                    <div style={{ paddingLeft: 20, marginTop: 4 }}>
                      <span style={{ fontSize: 12, background: "#ffe8ec", color: "#ff6b81", padding: "1px 8px", borderRadius: 10, fontWeight: 600 }}>0 đ</span>
                    </div>
                  </div>
                ))}
              </div>
              {cartItems.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #f5f5f5", marginBottom: 12 }}>
                  <img src={item.product.image} alt={item.product.name} style={{ width: 64, height: 64, objectFit: "contain", border: "1px solid #eee", borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#222", marginBottom: 2 }}>{item.product.brand}</div>
                    <div style={{ fontSize: 13, color: "#444" }}>{item.product.name}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, color: "#999" }}>{item.quantity} × {formatVnd(item.product.price)}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#f76c85" }}>{formatVnd(item.product.price * item.quantity)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>🎟️ Mã giảm giá</div>
                <button onClick={() => setShowVoucherPopup(true)}
                  style={{ background: "none", border: "none", color: "#ff6b81", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
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

            {/* Ghi chú + đặt hàng */}
            <div style={card}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <textarea placeholder="Ghi chú" value={note} onChange={e => setNote(e.target.value)} rows={2}
                  style={{ flex: 1, minWidth: 200, padding: "10px 14px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {discountAmount > 0 && (
                    <div style={{ fontSize: 13, color: "#22c55e", marginBottom: 4 }}>Giảm voucher: <b>-{formatVnd(discountAmount)}</b></div>
                  )}
                  <div style={{ fontSize: 14, color: "#444", marginBottom: 8 }}>
                    Tổng tiền ({cartItems.length})
                    <span style={{ fontWeight: 800, fontSize: 18, color: "#f76c85", marginLeft: 12 }}>{formatVnd(finalAmount)}</span>
                  </div>
                  <button onClick={handleOrder} disabled={loading || cartItems.length === 0}
                    style={{ background: loading ? "#aaa" : "#ff6b81", color: "#fff", border: "none", borderRadius: 25, padding: "12px 40px", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    {loading ? <><Spinner /> Đang xử lý...</> : "Đặt hàng"}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
                Nhấn "Đặt hàng" đồng nghĩa việc bạn đồng ý tuân theo{" "}
                <a href="/chinh-sach/chinh-sach-du-lieu-ca-nhan" style={{ color: "#ff6b81" }}>Chính sách xử lý dữ liệu cá nhân</a> &{" "}
                <a href="/chinh-sach/dieu-khoan-su-dung" style={{ color: "#ff6b81" }}>Điều khoản sử dụng</a>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="col-lg-4">
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8e8e8", padding: "20px 24px", position: "sticky", top: 80 }}>
              <button onClick={handleOrder} disabled={loading || cartItems.length === 0}
                style={{ width: "100%", background: loading ? "#aaa" : "#ff6b81", color: "#fff", border: "none", borderRadius: 25, padding: "14px", fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <><Spinner /> Đang xử lý...</> : "Đặt hàng"}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Đơn hàng ({cartItems.length} sản phẩm)</span>
                <button style={linkBtn()} onClick={() => navigate("/gio-hang")}>Thay đổi</button>
              </div>

              <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: 14, paddingRight: 2 }}>
                {cartItems.map(item => (
                  <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "center", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #f5f5f5" }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img src={item.product.image} alt={item.product.name} style={{ width: 52, height: 52, objectFit: "contain", border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }} />
                      <span style={{ position: "absolute", top: -6, right: -6, background: "#ff6b81", color: "#fff", fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff" }}>
                        {item.quantity}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#999", marginBottom: 2, textTransform: "uppercase" }}>{item.product.brand}</div>
                      <div style={{ fontSize: 12, color: "#333", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.product.name}</div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#ff6b81", whiteSpace: "nowrap" }}>{formatVnd(item.product.price * item.quantity)}</div>
                      {item.quantity > 1 && <div style={{ fontSize: 11, color: "#aaa" }}>{item.quantity} × {formatVnd(item.product.price)}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                <span style={{ color: "#666" }}>Tạm tính ({cartItems.length})</span>
                <span>{formatVnd(totalAmount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14 }}>
                <span style={{ color: "#666" }}>Giảm giá {voucherInfo ? `(${voucherInfo.code})` : ""}</span>
                <span style={{ color: discountAmount > 0 ? "#22c55e" : "#333" }}>
                  {discountAmount > 0 ? `-${formatVnd(discountAmount)}` : "0 đ"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 14 }}>
                <span style={{ color: "#666" }}>Phí vận chuyển</span>
                <span>0 đ</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: 12, marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Thành tiền (Đã VAT)</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: "#f76c85" }}>{formatVnd(finalAmount)}</span>
              </div>
              <p style={{ fontSize: 12, color: "#888", textAlign: "center", lineHeight: 1.6 }}>
                Đã bao gồm VAT, phí đóng gói, phí vận chuyển và các chi phí khác vui lòng xem{" "}
                <a href="/chinh-sach/chinh-sach-van-chuyen" style={{ color: "#ff6b81" }}>Chính sách vận chuyển</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <VoucherPopup
        show={showVoucherPopup}
        onClose={() => setShowVoucherPopup(false)}
        totalAmount={totalAmount}
        onSelect={(code) => {
          setVoucherCode(code);
          applyVoucher(totalAmount, code);
        }}
      />

      <AddressModal
        show={showAddressModal}
        onClose={() => { if (addresses.length === 0) navigate("/gio-hang"); else setShowAddressModal(false); }}
        onSave={handleSaveAddress}
        editData={editData}
      />

      <PaymentModal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        paymentMethod={paymentMethod}
        totalAmount={finalAmount}
      />
    </div>
  );
}

function Spinner() {
  return <span style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />;
}

const s = document.createElement("style");
s.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
if (!document.head.querySelector("[data-spin]")) { s.setAttribute("data-spin", "1"); document.head.appendChild(s); }