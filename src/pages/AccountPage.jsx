import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";

// ── Dữ liệu menu sidebar ──
const MENU_ITEMS = [
  { key: "info", icon: "👤", label: "Quản lý tài khoản" },
  { key: "orders", icon: "📦", label: "Đơn hàng của tôi" },
  { key: "address", icon: "📍", label: "Sổ địa chỉ nhận hàng" },
  { key: "wishlist", icon: "❤️", label: "Danh sách yêu thích" },
  { key: "faq", icon: "💬", label: "Hỏi đáp" },
];

// ── Dữ liệu giả đơn hàng ──
const FAKE_ORDERS = [
  { id: "DH20240001", date: "01/04/2024", total: 360000, status: "delivered", items: ["Sữa Rửa Mặt CeraVe 473ml"] },
  { id: "DH20240002", date: "05/04/2024", total: 185000, status: "shipping", items: ["Kem Chống Nắng Anessa 60ml", "Tẩy Trang Bioderma 250ml"] },
  { id: "DH20240003", date: "08/04/2024", total: 520000, status: "processing", items: ["Serum Vitamin C Obagi 30ml"] },
  { id: "DH20240004", date: "09/04/2024", total: 95000, status: "cancelled", items: ["Toner Klairs 180ml"] },
];

const STATUS_MAP = {
  processing: { label: "Đang xử lý", color: "#f59e0b", bg: "#fffbeb" },
  shipping: { label: "Đang giao", color: "#3b82f6", bg: "#eff6ff" },
  delivered: { label: "Đã giao", color: "#22c55e", bg: "#f0fdf4" },
  cancelled: { label: "Đã hủy", color: "#ef4444", bg: "#fef2f2" },
};

function formatVnd(v) { return `${v.toLocaleString("vi-VN")} đ`; }

export default function AccountPage() {
  const { currentUser, logout, addresses } = useCart();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");

  // Form chỉnh sửa thông tin
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [gender, setGender] = useState("nu");
  const [dob, setDob] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const handleSaveInfo = () => {
    setSaveMsg("✅ Lưu thành công!");
    setEditing(false);
    setTimeout(() => setSaveMsg(""), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ─── Avatar chữ cái đầu ───
  const avatarLetter = (currentUser?.name || "U").charAt(0).toUpperCase();

  // ─── Styles chung ───
  const card = { background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "24px 28px", marginBottom: 16 };
  const primary = "#ff6b81";

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Breadcrumb */}
      <div className="container" style={{ paddingTop: 20, paddingBottom: 8, fontSize: 13, color: "#888" }}>
        <Link to="/" style={{ color: "#888", textDecoration: "none" }}>Trang chủ</Link>
        <span style={{ margin: "0 6px" }}>›</span>
        <span style={{ color: "#333" }}>Thông tin tài khoản</span>
      </div>

      <div className="container">
        <div className="row g-4" style={{ alignItems: "flex-start" }}>

          {/* ══════ SIDEBAR TRÁI ══════ */}
          <div className="col-lg-3">
            {/* Avatar + tên */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "24px 20px", marginBottom: 8, textAlign: "center" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: `linear-gradient(135deg, ${primary}, #ff8fa3)`,
                color: "#fff", fontSize: 28, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px", boxShadow: `0 4px 16px ${primary}55`,
              }}>
                {avatarLetter}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 2 }}>{currentUser?.name || "Người dùng"}</div>
              <div style={{ fontSize: 12, color: primary, cursor: "pointer" }} onClick={() => { setActiveTab("info"); setEditing(true); }}>
                Chỉnh sửa tài khoản
              </div>
            </div>

            {/* Menu items */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" }}>
              {MENU_ITEMS.map((item, i) => (
                <div key={item.key} onClick={() => setActiveTab(item.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "13px 20px", cursor: "pointer",
                    borderBottom: i < MENU_ITEMS.length - 1 ? "1px solid #f5f5f5" : "none",
                    background: activeTab === item.key ? "#fff5f7" : "#fff",
                    borderLeft: activeTab === item.key ? `3px solid ${primary}` : "3px solid transparent",
                    transition: "all 0.15s",
                  }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: activeTab === item.key ? 700 : 400, color: activeTab === item.key ? primary : "#444" }}>
                    {item.label}
                  </span>
                </div>
              ))}

              {/* Đăng xuất */}
              <div onClick={handleLogout}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", cursor: "pointer", borderTop: "1px solid #f5f5f5" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fff5f7"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                <span style={{ fontSize: 16 }}>🚪</span>
                <span style={{ fontSize: 14, color: "#e53935" }}>Đăng xuất</span>
              </div>
            </div>
          </div>

          {/* ══════ NỘI DUNG PHẢI ══════ */}
          <div className="col-lg-9">

            {/* ── TAB: QUẢN LÝ TÀI KHOẢN ── */}
            {activeTab === "info" && (
              <div>
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h5 style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Thông tin tài khoản</h5>
                    {!editing && (
                      <button onClick={() => setEditing(true)}
                        style={{ background: "none", border: `1px solid ${primary}`, color: primary, borderRadius: 20, padding: "6px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Chỉnh sửa
                      </button>
                    )}
                  </div>

                  {saveMsg && (
                    <div style={{ background: "#f0fdf4", color: "#166534", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>{saveMsg}</div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Họ và tên</label>
                      {editing
                        ? <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                        : <div style={valueStyle}>{name || "—"}</div>
                      }
                    </div>
                    <div className="col-md-6">
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Email</label>
                      {editing
                        ? <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                        : <div style={valueStyle}>{email || "—"}</div>
                      }
                    </div>
                    <div className="col-md-6">
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Số điện thoại</label>
                      {editing
                        ? <input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="Chưa cập nhật" />
                        : <div style={valueStyle}>{phone || <span style={{ color: "#ccc" }}>Chưa cập nhật</span>}</div>
                      }
                    </div>
                    <div className="col-md-6">
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Ngày sinh</label>
                      {editing
                        ? <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} />
                        : <div style={valueStyle}>{dob || <span style={{ color: "#ccc" }}>Chưa cập nhật</span>}</div>
                      }
                    </div>
                    {editing && (
                      <div className="col-12">
                        <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 8 }}>Giới tính</label>
                        <div style={{ display: "flex", gap: 16 }}>
                          {["nu", "nam", "khac"].map(g => (
                            <label key={g} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                              <input type="radio" name="gender" value={g} checked={gender === g} onChange={() => setGender(g)} style={{ accentColor: primary }} />
                              {g === "nu" ? "Nữ" : g === "nam" ? "Nam" : "Khác"}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {editing && (
                    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                      <button onClick={handleSaveInfo}
                        style={{ background: primary, color: "#fff", border: "none", borderRadius: 25, padding: "10px 32px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                        Lưu thay đổi
                      </button>
                      <button onClick={() => setEditing(false)}
                        style={{ background: "#f0f0f0", color: "#555", border: "none", borderRadius: 25, padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                        Hủy
                      </button>
                    </div>
                  )}
                </div>

                {/* Tùy chọn nhận thông tin */}
                <div style={card}>
                  <h6 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Tùy chọn đăng ký, cập nhật thông tin khuyến mãi</h6>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
                    <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} style={{ accentColor: primary, width: 16, height: 16 }} />
                    Đăng ký nhận thông tin khuyến mãi qua email
                  </label>
                </div>

                {/* Sổ địa chỉ preview */}
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h6 style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Sổ địa chỉ</h6>
                    <span onClick={() => setActiveTab("address")} style={{ fontSize: 13, color: primary, cursor: "pointer", fontWeight: 600 }}>Quản lý sổ địa chỉ</span>
                  </div>
                  {addresses.length === 0 ? (
                    <div style={{ color: "#aaa", fontSize: 14, textAlign: "center", padding: "16px 0" }}>Chưa có địa chỉ nào</div>
                  ) : (
                    addresses.slice(0, 1).map(addr => (
                      <div key={addr.id} style={{ border: "1.5px dashed #ddd", borderRadius: 8, padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                          {addr.fullName} – {'*'.repeat(addr.phone.length - 3)}{addr.phone.slice(-3)}
                          {addr.isDefault && <span style={{ marginLeft: 8, background: "#fff0f3", color: primary, fontSize: 11, padding: "1px 8px", borderRadius: 10, fontWeight: 700 }}>Mặc định</span>}
                        </div>
                        <div style={{ fontSize: 13, color: "#666" }}>{addr.street}, {addr.ward}, {addr.district}, {addr.province}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: ĐƠN HÀNG ── */}
            {activeTab === "orders" && (
              <div>
                <div style={{ ...card, padding: "18px 24px" }}>
                  <h5 style={{ fontWeight: 700, marginBottom: 0, fontSize: 18 }}>📦 Đơn hàng của tôi</h5>
                </div>

                {/* Tabs trạng thái */}
                <div style={{ display: "flex", gap: 0, marginBottom: 12, background: "#fff", borderRadius: 10, border: "1px solid #eee", overflow: "hidden" }}>
                  {["Tất cả", "Đang xử lý", "Đang giao", "Đã giao", "Đã hủy"].map(tab => (
                    <div key={tab} style={{ flex: 1, textAlign: "center", padding: "11px 4px", fontSize: 13, fontWeight: 500, cursor: "pointer", borderBottom: tab === "Tất cả" ? `2px solid ${primary}` : "2px solid transparent", color: tab === "Tất cả" ? primary : "#666" }}>
                      {tab}
                    </div>
                  ))}
                </div>

                {FAKE_ORDERS.map(order => {
                  const st = STATUS_MAP[order.status];
                  return (
                    <div key={order.id} style={{ ...card, marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>#{order.id}</span>
                          <span style={{ fontSize: 12, color: "#aaa", marginLeft: 10 }}>{order.date}</span>
                        </div>
                        <span style={{ background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{st.label}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>
                        {order.items.map((item, i) => <div key={i}>• {item}</div>)}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f5f5f5", paddingTop: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: primary }}>{formatVnd(order.total)}</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          {order.status === "delivered" && (
                            <button style={{ background: primary, color: "#fff", border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Mua lại</button>
                          )}
                          <button style={{ background: "#f5f5f5", color: "#555", border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Chi tiết</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── TAB: SỔ ĐỊA CHỈ ── */}
            {activeTab === "address" && (
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h5 style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>📍 Sổ địa chỉ nhận hàng</h5>
                  <Link to="/checkout" style={{ background: primary, color: "#fff", borderRadius: 20, padding: "8px 18px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    + Thêm địa chỉ
                  </Link>
                </div>

                {addresses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                    <div>Chưa có địa chỉ nào. Hãy thêm địa chỉ mới!</div>
                  </div>
                ) : (
                  addresses.map(addr => (
                    <div key={addr.id} style={{ border: `1.5px solid ${addr.isDefault ? primary : "#eee"}`, borderRadius: 10, padding: "16px 18px", marginBottom: 12, background: addr.isDefault ? "#fff5f7" : "#fafafa" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{addr.fullName}</span>
                            <span style={{ color: "#888", fontSize: 13 }}>| {addr.phone}</span>
                            {addr.isDefault && <span style={{ background: primary, color: "#fff", fontSize: 11, padding: "1px 8px", borderRadius: 10, fontWeight: 700 }}>Mặc định</span>}
                            <span style={{ background: "#f5f5f5", color: "#666", fontSize: 11, padding: "1px 8px", borderRadius: 10 }}>{addr.addressType}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "#555" }}>{addr.street}, {addr.ward}, {addr.district}, {addr.province}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                          <button style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#555" }}>✏️ Sửa</button>
                          {!addr.isDefault && <button style={{ background: "none", border: "1px solid #ffcdd2", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#e53935" }}>🗑️ Xóa</button>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── TAB: YÊU THÍCH ── */}
            {activeTab === "wishlist" && (
              <div style={card}>
                <h5 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18 }}>❤️ Danh sách yêu thích</h5>
                <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💝</div>
                  <div style={{ fontSize: 15, marginBottom: 16 }}>Chưa có sản phẩm yêu thích nào</div>
                  <Link to="/" style={{ background: primary, color: "#fff", borderRadius: 25, padding: "10px 28px", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
                    Khám phá sản phẩm
                  </Link>
                </div>
              </div>
            )}

            {/* ── TAB: HỎI ĐÁP ── */}
            {activeTab === "faq" && (
              <div style={card}>
                <h5 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18 }}>💬 Hỏi đáp</h5>
                {[
                  { q: "Tôi có thể đổi trả hàng không?", a: "Có, bạn có thể đổi trả trong vòng 30 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên vẹn." },
                  { q: "Thời gian giao hàng là bao lâu?", a: "Giao hàng nhanh 2H trong nội thành TP.HCM và Hà Nội. Các tỉnh thành khác từ 2-5 ngày làm việc." },
                  { q: "Làm sao để tích điểm?", a: "Mỗi 1.000đ mua hàng bạn nhận được 1 điểm thưởng. Điểm được cộng tự động sau khi đơn hàng giao thành công." },
                  { q: "Tôi quên mật khẩu thì làm thế nào?", a: "Bấm vào 'Quên mật khẩu' tại màn hình đăng nhập, nhập email/SĐT để nhận OTP đặt lại mật khẩu." },
                ].map((item, i) => (
                  <FaqItem key={i} q={item.q} a={item.a} primary={primary} />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component FAQ accordion ──
function FaqItem({ q, a, primary }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 12, marginBottom: 12 }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "4px 0" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#222", flex: 1, paddingRight: 12 }}>{q}</span>
        <span style={{ color: primary, fontSize: 18, flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </div>
      {open && <div style={{ fontSize: 13, color: "#666", lineHeight: 1.7, paddingTop: 8, paddingRight: 24 }}>{a}</div>}
    </div>
  );
}

// ── Shared styles ──
const inputStyle = {
  width: "100%", padding: "10px 14px",
  border: "1px solid #e0e0e0", borderRadius: 8,
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
const valueStyle = {
  fontSize: 14, color: "#222",
  padding: "10px 14px",
  background: "#fafafa", borderRadius: 8,
  border: "1px solid #f0f0f0",
};