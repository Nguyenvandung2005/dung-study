import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../components/CartContext";

const MENU_ITEMS = [
  { key: "info", label: "Quản lý tài khoản" },
  { key: "orders", label: "Đơn hàng của tôi" },
  { key: "address", label: "Sổ địa chỉ nhận hàng" },
  { key: "buyagain", label: "Mua lại" },
  { key: "faq", label: "Hỏi đáp" },
];

const STATUS_MAP = {
  processing: { label: "Đang xử lý", color: "#f59e0b", bg: "#fffbeb" },
  shipping: { label: "Đang giao", color: "#3b82f6", bg: "#eff6ff" },
  delivered: { label: "Đã giao", color: "#22c55e", bg: "#f0fdf4" },
  cancelled: { label: "Đã hủy", color: "#ef4444", bg: "#fef2f2" },
};

const ORDER_TABS = ["Tất cả", "Đang xử lý", "Đang giao", "Đã giao", "Đã hủy"];
const TAB_STATUS = { "Tất cả": null, "Đang xử lý": "processing", "Đang giao": "shipping", "Đã giao": "delivered", "Đã hủy": "cancelled" };

function formatVnd(v) { return `${v.toLocaleString("vi-VN")} đ`; }
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

const primary = "#ff6b81";
const card = { background: "#fff", borderRadius: 8, border: "1px solid #eee", padding: "24px 28px", marginBottom: 16 };
const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box" };
const valueStyle = { fontSize: 14, color: "#222", padding: "10px 14px", background: "#fafafa", borderRadius: 6, border: "1px solid #f0f0f0" };

export default function AccountPage() {
  const { currentUser, logout, addresses, addToCart } = useCart();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || currentUser?.contact || "");
  const [phone, setPhone] = useState(currentUser?.phone || (!currentUser?.contact?.includes("@") ? currentUser?.contact : "") || "");
  const [gender, setGender] = useState(currentUser?.gender || "nu");
  const [dob, setDob] = useState(currentUser?.dob || "");
  const [newsletter, setNewsletter] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // ── Đơn hàng từ MongoDB ──
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeOrderTab, setActiveOrderTab] = useState("Tất cả");
  const [buyAgainMsg, setBuyAgainMsg] = useState("");

  useEffect(() => {
    if (activeTab !== "orders" && activeTab !== "buyagain") return;
    if (!currentUser) return;
    const userId = currentUser.id || currentUser.contact || currentUser.email || "guest";
    setOrdersLoading(true);
    fetch(`/api/orders/${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [activeTab, currentUser]);

  const filteredOrders = orders.filter(o => {
    const statusFilter = TAB_STATUS[activeOrderTab];
    return !statusFilter || o.status === statusFilter;
  });

  const avatarLetter = (currentUser?.name || "U").charAt(0).toUpperCase();

  const handleSaveInfo = () => {
    setSaveMsg("✅ Lưu thành công!");
    setEditing(false);
    setTimeout(() => setSaveMsg(""), 2500);
  };

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingBottom: 60 }}>
      <div className="container" style={{ paddingTop: 20, paddingBottom: 12, fontSize: 13, color: "#888" }}>
        <Link to="/" style={{ color: "#888", textDecoration: "none" }}>Trang chủ</Link>
        <span style={{ margin: "0 6px" }}>›</span>
        <span style={{ color: "#333" }}>Thông tin tài khoản</span>
      </div>

      <div className="container">
        <div className="row g-4" style={{ alignItems: "flex-start" }}>

          {/* SIDEBAR */}
          <div className="col-lg-3">
            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #eee", padding: "20px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${primary}, #ff8fa3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#fff", fontWeight: 800, flexShrink: 0 }}>
                {avatarLetter}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>Chào {currentUser?.name || "Người dùng"}</div>
                <div style={{ fontSize: 12, color: primary, cursor: "pointer", marginTop: 2 }}
                  onClick={() => { setActiveTab("info"); setEditing(true); }}>
                  Chỉnh sửa tài khoản
                </div>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #eee", overflow: "hidden" }}>
              {MENU_ITEMS.map((item, i) => (
                <div key={item.key} onClick={() => setActiveTab(item.key)}
                  style={{ padding: "12px 18px", cursor: "pointer", fontSize: 14, borderBottom: i < MENU_ITEMS.length - 1 ? "1px solid #f5f5f5" : "none", color: activeTab === item.key ? primary : "#444", fontWeight: activeTab === item.key ? 700 : 400, background: "#fff" }}
                  onMouseEnter={e => e.currentTarget.style.color = primary}
                  onMouseLeave={e => e.currentTarget.style.color = activeTab === item.key ? primary : "#444"}
                >
                  {item.label}
                </div>
              ))}
              <div onClick={handleLogout}
                style={{ padding: "12px 18px", cursor: "pointer", fontSize: 14, color: "#555", borderTop: "1px solid #f0f0f0" }}
                onMouseEnter={e => e.currentTarget.style.color = primary}
                onMouseLeave={e => e.currentTarget.style.color = "#555"}
              >
                Đăng xuất
              </div>
            </div>
          </div>

          {/* NỘI DUNG */}
          <div className="col-lg-9">

            {/* TAB: QUẢN LÝ TÀI KHOẢN */}
            {activeTab === "info" && (
              <div>
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h5 style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Thông tin tài khoản</h5>
                    {!editing && (
                      <button onClick={() => setEditing(true)}
                        style={{ background: primary, color: "#fff", border: "none", borderRadius: 4, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Chỉnh sửa
                      </button>
                    )}
                  </div>
                  {saveMsg && <div style={{ background: "#f0fdf4", color: "#166534", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>{saveMsg}</div>}
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Họ và tên</label>
                      {editing ? <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} /> : <div style={valueStyle}>{name || "—"}</div>}
                    </div>
                    <div className="col-md-4">
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Email/SĐT</label>
                      <div style={valueStyle}>{email || "—"}</div>
                    </div>
                    <div className="col-md-6">
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Số điện thoại</label>
                      {editing ? <input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} /> : <div style={valueStyle}>{phone || <span style={{ color: "#ccc" }}>Chưa cập nhật</span>}</div>}
                    </div>
                    <div className="col-md-6">
                      <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Ngày sinh</label>
                      {editing ? <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} /> : <div style={valueStyle}>{dob || <span style={{ color: "#ccc" }}>Chưa cập nhật</span>}</div>}
                    </div>
                    {editing && (
                      <div className="col-12">
                        <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 8 }}>Giới tính</label>
                        <div style={{ display: "flex", gap: 16 }}>
                          {[{ v: "nu", l: "Nữ" }, { v: "nam", l: "Nam" }, { v: "khac", l: "Khác" }].map(g => (
                            <label key={g.v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                              <input type="radio" name="gender" value={g.v} checked={gender === g.v} onChange={() => setGender(g.v)} style={{ accentColor: primary }} />
                              {g.l}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {editing && (
                    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                      <button onClick={handleSaveInfo} style={{ background: primary, color: "#fff", border: "none", borderRadius: 4, padding: "10px 32px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Lưu thay đổi</button>
                      <button onClick={() => setEditing(false)} style={{ background: "#f0f0f0", color: "#555", border: "none", borderRadius: 4, padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Hủy</button>
                    </div>
                  )}
                </div>

                <div style={card}>
                  <h6 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Tùy chọn đăng ký, cập nhật thông tin khuyến mãi</h6>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
                    <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} style={{ accentColor: primary }} />
                    Đăng ký nhận thông tin khuyến mãi qua email
                  </label>
                  <button style={{ background: primary, color: "#fff", border: "none", borderRadius: 4, padding: "8px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer", marginTop: 14 }}>
                    Lưu thay đổi
                  </button>
                </div>

                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h6 style={{ fontWeight: 700, margin: 0, fontSize: 15 }}>Sổ địa chỉ</h6>
                    <span onClick={() => setActiveTab("address")} style={{ fontSize: 13, color: primary, cursor: "pointer", fontWeight: 600 }}>Quản lý sổ địa chỉ</span>
                  </div>
                  {addresses.length === 0 ? (
                    <div style={{ color: "#aaa", fontSize: 14 }}>Chưa có địa chỉ nào</div>
                  ) : (
                    addresses.slice(0, 1).map(addr => (
                      <div key={addr.id} style={{ border: "1.5px dashed #ddd", borderRadius: 6, padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                          {addr.fullName} – {'*'.repeat(Math.max(0, addr.phone.length - 3))}{addr.phone.slice(-3)}
                          {addr.isDefault && <span style={{ marginLeft: 8, background: "#fff0f3", color: primary, fontSize: 11, padding: "1px 8px", borderRadius: 10, fontWeight: 700 }}>Mặc định</span>}
                        </div>
                        <div style={{ fontSize: 13, color: "#666" }}>{addr.street}, {addr.ward}, {addr.district}, {addr.province}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: ĐƠN HÀNG */}
            {activeTab === "orders" && (
              <div>
                <div style={{ ...card, padding: "18px 24px" }}>
                  <h5 style={{ fontWeight: 700, marginBottom: 0, fontSize: 18 }}>Đơn hàng của tôi</h5>
                </div>

                {/* Tabs trạng thái */}
                <div style={{ display: "flex", marginBottom: 12, background: "#fff", borderRadius: 6, border: "1px solid #eee", overflow: "hidden" }}>
                  {ORDER_TABS.map((tab, i) => (
                    <div key={tab} onClick={() => setActiveOrderTab(tab)}
                      style={{ flex: 1, textAlign: "center", padding: "11px 4px", fontSize: 13, fontWeight: 500, cursor: "pointer", borderBottom: activeOrderTab === tab ? `2px solid ${primary}` : "2px solid transparent", color: activeOrderTab === tab ? primary : "#666" }}>
                      {tab}
                    </div>
                  ))}
                </div>

                {ordersLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>Đang tải đơn hàng...</div>
                ) : filteredOrders.length === 0 ? (
                  <div style={{ ...card, textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
                    <div>Chưa có đơn hàng nào</div>
                  </div>
                ) : (
                  filteredOrders.map(order => {
                    const st = STATUS_MAP[order.status] || STATUS_MAP.processing;
                    return (
                      <div key={order.id} style={{ ...card, marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>#{order.id}</span>
                            <span style={{ fontSize: 12, color: "#aaa", marginLeft: 10 }}>{formatDate(order.createdAt)}</span>
                          </div>
                          <span style={{ background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{st.label}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>
                          {order.items?.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              {item.image && <img src={item.image} alt={item.name} style={{ width: 40, height: 40, objectFit: "contain", border: "1px solid #eee", borderRadius: 4 }} />}
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase" }}>{item.brand}</div>
                                <div>{item.name}</div>
                              </div>
                              <div style={{ marginLeft: "auto", fontSize: 12, color: "#888" }}>x{item.quantity}</div>
                            </div>
                          ))}
                        </div>
                        {order.voucherCode && (
                          <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 6 }}>🎟️ Voucher: {order.voucherCode}</div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f5f5f5", paddingTop: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: primary }}>{formatVnd(order.finalAmount || order.totalAmount)}</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            {order.status === "delivered" && (
                              <button style={{ background: primary, color: "#fff", border: "none", borderRadius: 4, padding: "6px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Mua lại</button>
                            )}
                            <button style={{ background: "#f5f5f5", color: "#555", border: "none", borderRadius: 4, padding: "6px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Chi tiết</button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB: SỔ ĐỊA CHỈ */}
            {activeTab === "address" && (
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h5 style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Sổ địa chỉ nhận hàng</h5>
                  <Link to="/checkout" style={{ background: primary, color: "#fff", borderRadius: 4, padding: "8px 18px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>+ Thêm địa chỉ</Link>
                </div>
                {addresses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                    <div>Chưa có địa chỉ nào</div>
                  </div>
                ) : (
                  addresses.map(addr => (
                    <div key={addr.id} style={{ border: `1.5px solid ${addr.isDefault ? primary : "#eee"}`, borderRadius: 8, padding: "16px 18px", marginBottom: 12, background: addr.isDefault ? "#fff5f7" : "#fafafa" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{addr.fullName}</span>
                            <span style={{ color: "#888", fontSize: 13 }}>| {addr.phone}</span>
                            {addr.isDefault && <span style={{ background: primary, color: "#fff", fontSize: 11, padding: "1px 8px", borderRadius: 10, fontWeight: 700 }}>Mặc định</span>}
                          </div>
                          <div style={{ fontSize: 13, color: "#555" }}>{addr.street}, {addr.ward}, {addr.district}, {addr.province}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                          <button style={{ background: "none", border: "1px solid #ddd", borderRadius: 4, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#555" }}>Sửa</button>
                          {!addr.isDefault && <button style={{ background: "none", border: "1px solid #ffcdd2", borderRadius: 4, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#e53935" }}>Xóa</button>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: MUA LẠI */}
            {activeTab === "buyagain" && (
              <div style={card}>
                <h5 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18 }}>Mua lại</h5>
                {buyAgainMsg && (
                  <div style={{ background: "#f0fdf4", color: "#166534", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, fontWeight: 600 }}>✅ {buyAgainMsg}</div>
                )}
                {ordersLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>Đang tải...</div>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
                    <div style={{ fontSize: 15, marginBottom: 16 }}>Chưa có sản phẩm nào để mua lại</div>
                    <Link to="/san-pham" style={{ background: primary, color: "#fff", borderRadius: 4, padding: "10px 28px", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>Khám phá sản phẩm</Link>
                  </div>
                ) : (
                  orders.flatMap(o => o.items || []).map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f5f5f5" }}>
                      {item.image && <img src={item.image} alt={item.name} style={{ width: 56, height: 56, objectFit: "contain", border: "1px solid #eee", borderRadius: 6 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase" }}>{item.brand}</div>
                        <div style={{ fontSize: 13, color: "#333" }}>{item.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: primary }}>{formatVnd(item.price)}</div>
                      </div>
                      <button
                        onClick={() => {
                          addToCart({ id: item.productId, name: item.name, brand: item.brand, image: item.image, price: item.price });
                          setBuyAgainMsg("Đã thêm vào giỏ hàng!");
                          setTimeout(() => setBuyAgainMsg(""), 2500);
                        }}
                        style={{ background: primary, color: "#fff", borderRadius: 4, padding: "6px 16px", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Mua lại
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: HỎI ĐÁP */}
            {activeTab === "faq" && (
              <div style={card}>
                <h5 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18 }}>Hỏi đáp</h5>
                {[
                  { q: "Tôi có thể đổi trả hàng không?", a: "Có, bạn có thể đổi trả trong vòng 30 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên vẹn." },
                  { q: "Thời gian giao hàng là bao lâu?", a: "Giao hàng nhanh 2H trong nội thành TP.HCM và Hà Nội. Các tỉnh thành khác từ 2-5 ngày làm việc." },
                  { q: "Làm sao để tích điểm?", a: "Mỗi 1.000đ mua hàng bạn nhận được 1 điểm thưởng. Điểm được cộng tự động sau khi đơn hàng giao thành công." },
                  { q: "Tôi quên mật khẩu thì làm thế nào?", a: "Bấm vào 'Quên mật khẩu' tại màn hình đăng nhập, nhập email/SĐT để nhận OTP đặt lại mật khẩu." },
                  { q: "Làm sao theo dõi đơn hàng?", a: "Vào mục 'Đơn hàng của tôi' trong tài khoản để xem trạng thái đơn hàng chi tiết." },
                ].map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 12, marginBottom: 12 }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "4px 0" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#222", flex: 1, paddingRight: 12 }}>{q}</span>
        <span style={{ color: primary, fontSize: 18, flexShrink: 0, transform: open ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.2s" }}>+</span>
      </div>
      {open && <div style={{ fontSize: 13, color: "#666", lineHeight: 1.7, paddingTop: 8 }}>{a}</div>}
    </div>
  );
}