import React, { useState } from "react";
import { Link } from "react-router-dom";

const PRIMARY = "#ff6b81";
const PRIMARY_LIGHT = "#fff0f3";
const PRIMARY_DARK = "#e8556b";

// ── Thông tin liên hệ — chỉnh tại đây ──
const CONTACT_INFO = {
  address: "Số 57, đường Quang Trung, Quận Gò Vấp, TP. Hồ Chí Minh",
  phone: "0909 123 456",
  email: "pinkycloudvietnam@gmail.com",
  website: "www.pinkycloud.vn",
  hours: [
    { day: "Thứ 2 – Thứ 6", time: "8:00 – 21:00" },
    { day: "Thứ 7 – Chủ nhật", time: "9:00 – 20:00" },
  ],
};

const SOCIAL_LINKS = [
  { name: "Facebook", icon: "f", color: "#1877f2", bg: "#e7f0fd", href: "#" },
  { name: "Instagram", icon: "IG", color: "#e1306c", bg: "#fce4ec", href: "#" },
  { name: "TikTok", icon: "TT", color: "#010101", bg: "#f0f0f0", href: "#" },
  { name: "YouTube", icon: "YT", color: "#ff0000", bg: "#ffe8e8", href: "#" },
];

// Google Maps embed — thay src bằng địa chỉ thật của bạn
const MAP_SRC = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4851!2d106.6654!3d10.8384!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529f77b37c5a9%3A0x9c6e7a36!2zUXXhuq1uIEfDsiBW4bqlcA!5e0!3m2!1svi!2svn";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Vui lòng nhập họ tên.";
    if (!form.email.trim()) errs.email = "Vui lòng nhập email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email không hợp lệ.";
    if (form.phone && !/^0\d{9}$/.test(form.phone)) errs.phone = "SĐT phải 10 số, bắt đầu bằng 0.";
    if (!form.message.trim()) errs.message = "Vui lòng nhập nội dung.";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    // Giả lập gửi form
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    }, 1500);
  };

  const inputStyle = (hasError) => ({
    width: "100%", padding: "12px 14px",
    border: `1.5px solid ${hasError ? "#e53935" : "#e8e8e8"}`,
    borderRadius: 10, fontSize: 14, color: "#333",
    outline: "none", boxSizing: "border-box",
    background: hasError ? "#fff5f5" : "#fafafa",
    transition: "border 0.2s",
  });

  return (
    <div style={{ background: "#f8f8f8", minHeight: "100vh", paddingBottom: 60 }}>

      {/* ── HERO BANNER ── */}
      <div style={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, #ff8fa3 50%, #ffb3c1 100%)`,
        padding: "48px 0 40px", marginBottom: 36, position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        {[
          { w: 200, h: 200, top: -60, right: 80, op: 0.08 },
          { w: 120, h: 120, top: 20, right: 240, op: 0.06 },
          { w: 80, h: 80, bottom: -20, left: 120, op: 0.07 },
        ].map((c, i) => (
          <div key={i} style={{ position: "absolute", width: c.w, height: c.h, borderRadius: "50%", background: "#fff", opacity: c.op, top: c.top, bottom: c.bottom, left: c.left, right: c.right }} />
        ))}

        <div className="container" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 16 }}>
            <Link to="/" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>Trang chủ</Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <span style={{ color: "#fff" }}>Liên hệ</span>
          </div>
          <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 32, margin: "0 0 10px", letterSpacing: 0.5 }}>Liên hệ với chúng tôi</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, margin: 0 }}>
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn 💗
          </p>
        </div>
      </div>

      <div className="container">

        {/* ── 3 THỐNG KÊ NHỎ ── */}
        <div className="row g-3" style={{ marginBottom: 32 }}>
          {[
            { icon: "⚡", title: "Phản hồi nhanh", desc: "Trong vòng 2 giờ làm việc" },
            { icon: "💯", title: "Hỗ trợ tận tâm", desc: "Đội ngũ tư vấn chuyên nghiệp" },
            { icon: "🎁", title: "Tư vấn miễn phí", desc: "Không mất phí tư vấn sản phẩm" },
          ].map((s, i) => (
            <div key={i} className="col-md-4">
              <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #eee", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: PRIMARY_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{s.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 2 CỘT CHÍNH ── */}
        <div className="row g-4" style={{ alignItems: "flex-start" }}>

          {/* ════ CỘT TRÁI: FORM ════ */}
          <div className="col-lg-7">
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", padding: "32px 36px", boxShadow: "0 2px 16px rgba(255,107,129,0.06)" }}>

              {submitted ? (
                // Màn hình thành công
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: PRIMARY_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 40 }}>💌</div>
                  <h4 style={{ fontWeight: 800, color: PRIMARY, marginBottom: 10 }}>Gửi thành công!</h4>
                  <p style={{ color: "#666", fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
                    Cảm ơn bạn đã liên hệ với <b>PinkyCloud</b>!<br />
                    Chúng tôi sẽ phản hồi trong vòng <b style={{ color: PRIMARY }}>2 giờ làm việc</b>.
                  </p>
                  <button onClick={() => setSubmitted(false)}
                    style={{ background: PRIMARY, color: "#fff", border: "none", borderRadius: 25, padding: "12px 32px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    Gửi tin nhắn khác
                  </button>
                </div>
              ) : (
                <>
                  <h4 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6, color: "#1a1a1a" }}>Gửi tin nhắn cho chúng tôi</h4>
                  <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại sớm nhất.</p>

                  <div className="row g-3">
                    {/* Họ tên */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Họ và tên <span style={{ color: PRIMARY }}>*</span></label>
                      <input name="name" value={form.name} onChange={handleChange} placeholder="Nhập họ tên của bạn" style={inputStyle(errors.name)} />
                      {errors.name && <div style={errStyle}>{errors.name}</div>}
                    </div>

                    {/* Email */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Email <span style={{ color: PRIMARY }}>*</span></label>
                      <input name="email" value={form.email} onChange={handleChange} placeholder="example@email.com" style={inputStyle(errors.email)} />
                      {errors.email && <div style={errStyle}>{errors.email}</div>}
                    </div>

                    {/* SĐT */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Số điện thoại</label>
                      <input name="phone" value={form.phone} onChange={handleChange} placeholder="0909 123 456" inputMode="numeric" maxLength={10} style={inputStyle(errors.phone)} />
                      {errors.phone && <div style={errStyle}>{errors.phone}</div>}
                    </div>

                    {/* Chủ đề */}
                    <div className="col-md-6">
                      <label style={labelStyle}>Chủ đề</label>
                      <select name="subject" value={form.subject} onChange={handleChange}
                        style={{ ...inputStyle(false), appearance: "none", cursor: "pointer", color: form.subject ? "#333" : "#aaa" }}>
                        <option value="">Chọn chủ đề</option>
                        <option value="tuvan">Tư vấn sản phẩm</option>
                        <option value="donhang">Vấn đề đơn hàng</option>
                        <option value="doitra">Đổi trả & hoàn tiền</option>
                        <option value="hopTac">Hợp tác kinh doanh</option>
                        <option value="khac">Khác</option>
                      </select>
                    </div>

                    {/* Nội dung */}
                    <div className="col-12">
                      <label style={labelStyle}>Nội dung <span style={{ color: PRIMARY }}>*</span></label>
                      <textarea name="message" value={form.message} onChange={handleChange}
                        placeholder="Nhập nội dung bạn cần hỗ trợ..." rows={5}
                        style={{ ...inputStyle(errors.message), resize: "vertical", fontFamily: "inherit" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        {errors.message ? <div style={errStyle}>{errors.message}</div> : <div />}
                        <div style={{ fontSize: 11, color: "#bbb" }}>{form.message.length}/500</div>
                      </div>
                    </div>

                    {/* Nút gửi */}
                    <div className="col-12">
                      <button onClick={handleSubmit} disabled={loading}
                        style={{
                          width: "100%", padding: "14px", border: "none", borderRadius: 25,
                          background: loading ? "#ddd" : `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`,
                          color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          boxShadow: loading ? "none" : `0 4px 16px ${PRIMARY}55`,
                          transition: "all 0.2s",
                        }}>
                        {loading ? <><BtnSpinner /> Đang gửi...</> : "💌 Gửi tin nhắn"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ════ CỘT PHẢI: THÔNG TIN + MXH ════ */}
          <div className="col-lg-5">

            {/* Thông tin liên hệ */}
            <div style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #ff8fa3 100%)`, borderRadius: 16, padding: "28px 28px", marginBottom: 16, color: "#fff" }}>
              <h5 style={{ fontWeight: 800, fontSize: 18, marginBottom: 22, color: "#fff" }}>📋 Thông tin liên hệ</h5>

              {[
                { icon: "📍", label: "Địa chỉ", value: CONTACT_INFO.address },
                { icon: "📞", label: "Hotline", value: CONTACT_INFO.phone },
                { icon: "✉️", label: "Email", value: CONTACT_INFO.email },
                { icon: "🌐", label: "Website", value: CONTACT_INFO.website },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.5 }}>{item.value}</div>
                  </div>
                </div>
              ))}

              {/* Giờ làm việc */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.25)", paddingTop: 16, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>🕐</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Giờ làm việc</span>
                </div>
                {CONTACT_INFO.hours.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: "rgba(255,255,255,0.8)" }}>{h.day}</span>
                    <span style={{ fontWeight: 700 }}>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mạng xã hội */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #eee", padding: "22px 24px", marginBottom: 16 }}>
              <h6 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#222" }}>🌸 Theo dõi PinkyCloud</h6>
              <div style={{ display: "flex", gap: 10 }}>
                {SOCIAL_LINKS.map(s => (
                  <a key={s.name} href={s.href} target="_blank" rel="noreferrer"
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 6px", background: s.bg, borderRadius: 12, textDecoration: "none", transition: "transform 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: s.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>
                      {s.icon}
                    </div>
                    <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Hỗ trợ nhanh */}
            <div style={{ background: PRIMARY_LIGHT, borderRadius: 16, border: `1px solid ${PRIMARY}33`, padding: "18px 22px" }}>
              <h6 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: PRIMARY }}>⚡ Hỗ trợ nhanh</h6>
              {[
                { icon: "💬", label: "Chat Zalo", desc: "Nhắn tin ngay", href: "#" },
                { icon: "📞", label: "Gọi Hotline", desc: CONTACT_INFO.phone, href: `tel:${CONTACT_INFO.phone.replace(/\s/g, "")}` },
                { icon: "✉️", label: "Gửi Email", desc: CONTACT_INFO.email, href: `mailto:${CONTACT_INFO.email}` },
              ].map((item, i) => (
                <a key={i} href={item.href}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 2 ? `1px solid ${PRIMARY}22` : "none", textDecoration: "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: `0 2px 8px ${PRIMARY}22` }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{item.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: PRIMARY, fontSize: 16 }}>›</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── BẢN ĐỒ GOOGLE MAPS ── */}
        <div style={{ marginTop: 32, background: "#fff", borderRadius: 16, border: "1px solid #eee", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🗺️</span>
            <div>
              <h6 style={{ fontWeight: 700, margin: 0, fontSize: 16 }}>Tìm đường đến PinkyCloud</h6>
              <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{CONTACT_INFO.address}</div>
            </div>
          </div>
          <iframe
            src={MAP_SRC}
            width="100%" height="380"
            style={{ border: 0, display: "block" }}
            allowFullScreen loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="PinkyCloud Map"
          />
        </div>

      </div>
    </div>
  );
}

// ── Shared styles ──
const labelStyle = { fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 };
const errStyle = { fontSize: 12, color: "#e53935", marginTop: 4 };

function BtnSpinner() {
  return (
    <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
  );
}

const s = document.createElement("style");
s.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
if (!document.head.querySelector("[data-contact-spin]")) {
  s.setAttribute("data-contact-spin", "1");
  document.head.appendChild(s);
}