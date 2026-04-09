import React, { useState } from "react";

export default function RegisterModal({ show, onClose, onSwitchToLogin }) {
  const [gender, setGender] = useState("nu");
  const [agreed, setAgreed] = useState(true);
  const [newsletter, setNewsletter] = useState(true);
  const [privacy, setPrivacy] = useState(true);
  const [captchaInput, setCaptchaInput] = useState("");
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  if (!show) return null;

  const captchaCode = "k1kb";
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#fff",
    color: "#333",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "10px",
          width: "100%",
          maxWidth: "440px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px 32px 24px",
          position: "relative",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "14px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "22px",
            cursor: "pointer",
            color: "#888",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <h5
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: "18px",
            marginBottom: "20px",
            color: "#222",
          }}
        >
          Đăng ký tài khoản
        </h5>

        {/* Email / SĐT */}
        <div style={{ marginBottom: "12px", position: "relative" }}>
          <input
            type="text"
            placeholder="Nhập email hoặc số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ ...inputStyle, paddingRight: "36px" }}
          />
          <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "16px" }}>✉</span>
        </div>

        {/* Captcha */}
        <div style={{ marginBottom: "12px", display: "flex", gap: "8px", alignItems: "stretch" }}>
          <input
            type="text"
            placeholder="Nhập captcha"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            style={{ ...inputStyle, flex: 1, width: "auto" }}
          />
          <div
            style={{
              background: "#2d6a4f",
              color: "#fff",
              fontWeight: 700,
              fontSize: "17px",
              padding: "10px 16px",
              borderRadius: "4px",
              letterSpacing: "4px",
              fontFamily: "monospace",
              userSelect: "none",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
            }}
          >
            {captchaCode}
          </div>
        </div>

        {/* OTP */}
        <div style={{ marginBottom: "4px", display: "flex", gap: "8px", alignItems: "stretch" }}>
          <input
            type="text"
            placeholder="Nhập mã xác thực 6 số"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ ...inputStyle, flex: 1, width: "auto" }}
          />
          <button
            style={{
              background: "#326e51",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            lấy mã
          </button>
        </div>
        <div style={{ marginBottom: "12px" }}>
          <a href="#" style={{ fontSize: "13px", color: "#1a73e8", textDecoration: "none" }}>
            Xem hướng dẫn nhận OTP
          </a>
        </div>

        {/* Mật khẩu */}
        <div style={{ marginBottom: "12px", position: "relative" }}>
          <input
            type="password"
            placeholder="Nhập mật khẩu từ 6 - 32 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, paddingRight: "36px" }}
          />
          <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "15px" }}>🔒</span>
        </div>

        {/* Họ tên */}
        <div style={{ marginBottom: "12px", position: "relative" }}>
          <input
            type="text"
            placeholder="Họ tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ ...inputStyle, paddingRight: "36px" }}
          />
          <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "15px" }}>👤</span>
        </div>

        {/* Giới tính */}
        <div style={{ marginBottom: "12px", display: "flex", gap: "20px", alignItems: "center" }}>
          {[
            { value: "khong_xac_dinh", label: "Không xác định" },
            { value: "nam", label: "Nam" },
            { value: "nu", label: "Nữ" },
          ].map((g) => (
            <label key={g.value} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "14px", color: "#333" }}>
              <input
                type="radio"
                name="gender"
                value={g.value}
                checked={gender === g.value}
                onChange={() => setGender(g.value)}
                style={{ accentColor: "#326e51" }}
              />
              {g.label}
            </label>
          ))}
        </div>

        {/* Ngày sinh */}
        <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
          {[
            { label: "Ngày", value: day, setter: setDay, options: days },
            { label: "Tháng", value: month, setter: setMonth, options: months },
            { label: "Năm", value: year, setter: setYear, options: years },
          ].map((item) => (
            <select
              key={item.label}
              value={item.value}
              onChange={(e) => item.setter(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 8px",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "14px",
                color: item.value ? "#333" : "#999",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <option value="">{item.label}</option>
              {item.options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ))}
        </div>

        {/* Checkboxes */}
        <div style={{ marginBottom: "16px" }}>
          {[
            {
              state: agreed, setter: setAgreed,
              label: (
                <span style={{ fontSize: "13px", color: "#333" }}>
                  Tôi đã đọc và đồng ý với{" "}
                  <a href="#" style={{ color: "#1a73e8" }}>Điều kiện giao dịch chung</a> và{" "}
                  <a href="#" style={{ color: "#1a73e8" }}>Chính sách bảo mật thông tin</a> của Hasaki
                </span>
              )
            },
            {
              state: newsletter, setter: setNewsletter,
              label: <span style={{ fontSize: "13px", color: "#333" }}>Nhận thông tin khuyến mãi qua e-mail</span>
            },
            {
              state: privacy, setter: setPrivacy,
              label: (
                <span style={{ fontSize: "13px", color: "#333" }}>
                  Tôi đồng ý với{" "}
                  <a href="#" style={{ color: "#1a73e8" }}>chính sách xử lý dữ liệu cá nhân</a> của Hasaki
                </span>
              )
            },
          ].map((item, i) => (
            <label key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={item.state}
                onChange={(e) => item.setter(e.target.checked)}
                style={{ marginTop: "2px", accentColor: "#326e51", flexShrink: 0 }}
              />
              {item.label}
            </label>
          ))}
        </div>

        {/* Nút đăng ký */}
        <button
          style={{
            width: "100%",
            padding: "13px",
            background: "#326e51",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: "14px",
            letterSpacing: "0.5px",
          }}
        >
          Đăng ký
        </button>

        {/* Link đăng nhập */}
        <p style={{ textAlign: "center", fontSize: "14px", margin: "0 0 10px", color: "#333" }}>
          Bạn đã có tài khoản?{" "}
          <span
            onClick={onSwitchToLogin}
            style={{ color: "#326e51", fontWeight: 700, cursor: "pointer" }}
          >
            ĐĂNG NHẬP
          </span>
        </p>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#666", marginBottom: "10px" }}>
          Hoặc đăng nhập với:
        </p>

        {/* Facebook */}
        <button
          style={{
            width: "100%",
            padding: "11px",
            background: "#1877f2",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
          </svg>
          Facebook
        </button>

        {/* Google */}
        <button
          style={{
            width: "100%",
            padding: "11px",
            background: "#fff",
            color: "#333",
            border: "1px solid #ddd",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Đăng nhập bằng Google
        </button>
      </div>
    </div>
  );
}