import React, { useState } from "react";

// Tài khoản giả lập để test đăng nhập thường
const FAKE_ACCOUNTS = [
  { email: "test@gmail.com", password: "123456", name: "Nguyễn Văn A" },
  { email: "0909123456", password: "123456", name: "Trần Thị B" },
];

// Thông tin giả lập trả về khi đăng nhập Google/Facebook thành công
const FAKE_GOOGLE_USER = { name: "Nguyễn Google", email: "user@gmail.com", avatar: "https://ui-avatars.com/api/?name=Nguyen+Google&background=4285F4&color=fff" };
const FAKE_FACEBOOK_USER = { name: "Nguyễn Facebook", email: "user@facebook.com", avatar: "https://ui-avatars.com/api/?name=Nguyen+Facebook&background=1877f2&color=fff" };

export default function LoginModal({ show, onClose, onLoginSuccess, onSwitchToRegister }) {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loading, setLoading] = useState(null); // null | 'google' | 'facebook' | 'normal'
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!show) return null;

  // --- Giả lập loading + thành công ---
  const simulateOAuth = (provider) => {
    setError("");
    setLoading(provider);
    setSuccessMsg("");

    // Giả lập popup OAuth mở ra và xác thực sau 1.5 giây
    setTimeout(() => {
      const fakeUser = provider === "google" ? FAKE_GOOGLE_USER : FAKE_FACEBOOK_USER;
      setLoading(null);
      setSuccessMsg(`✅ Đăng nhập bằng ${provider === "google" ? "Google" : "Facebook"} thành công! Xin chào ${fakeUser.name}`);

      // Đóng modal và thông báo thành công sau 1 giây nữa
      setTimeout(() => {
        onLoginSuccess(fakeUser);
      }, 1000);
    }, 1500);
  };

  // --- Giả lập đăng nhập thường ---
  const handleNormalLogin = () => {
    setError("");
    if (!emailInput || !passwordInput) {
      setError("Vui lòng nhập email/SĐT và mật khẩu.");
      return;
    }
    setLoading("normal");
    setTimeout(() => {
      const found = FAKE_ACCOUNTS.find(
        (acc) => acc.email === emailInput && acc.password === passwordInput
      );
      setLoading(null);
      if (found) {
        setSuccessMsg(`✅ Đăng nhập thành công! Xin chào ${found.name}`);
        setTimeout(() => onLoginSuccess(found), 1000);
      } else {
        setError("❌ Email/SĐT hoặc mật khẩu không đúng. Thử: test@gmail.com / 123456");
      }
    }, 1200);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#f7f7f7",
    color: "#333",
    boxSizing: "border-box",
  };

  const overlayStyle = {
    position: "fixed", inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 1050,
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <div style={overlayStyle}>
      <div style={{
        background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "420px",
        padding: "28px 32px 24px", position: "relative",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        {/* Nút đóng */}
        <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "16px", background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#888" }}>×</button>

        <h5 style={{ textAlign: "center", fontWeight: 700, fontSize: "18px", marginBottom: "20px", color: "#222" }}>
          Đăng nhập với
        </h5>

        {/* Thông báo thành công */}
        {successMsg && (
          <div style={{ background: "#e8f5e9", color: "#2e7d32", borderRadius: "6px", padding: "10px 14px", marginBottom: "14px", fontSize: "14px", textAlign: "center" }}>
            {successMsg}
          </div>
        )}

        {/* Thông báo lỗi */}
        {error && (
          <div style={{ background: "#fdecea", color: "#c62828", borderRadius: "6px", padding: "10px 14px", marginBottom: "14px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* Nút Facebook */}
        <button
          onClick={() => simulateOAuth("facebook")}
          disabled={!!loading}
          style={{
            width: "100%", padding: "11px", background: loading === "facebook" ? "#aac4f0" : "#1877f2",
            color: "#fff", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", marginBottom: "10px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            transition: "background 0.2s",
          }}
        >
          {loading === "facebook" ? (
            <><Spinner /> Đang kết nối Facebook...</>
          ) : (
            <><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" /></svg> Facebook</>
          )}
        </button>

        {/* Nút Google */}
        <button
          onClick={() => simulateOAuth("google")}
          disabled={!!loading}
          style={{
            width: "100%", padding: "11px", background: "#fff", color: "#333",
            border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", marginBottom: "20px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            transition: "box-shadow 0.2s",
          }}
        >
          {loading === "google" ? (
            <><Spinner color="#4285F4" /> Đang kết nối Google...</>
          ) : (
            <><GoogleIcon /> Đăng nhập bằng Google</>
          )}
        </button>

        {/* Divider */}
        <div style={{ position: "relative", textAlign: "center", marginBottom: "16px" }}>
          <hr style={{ borderColor: "#eee" }} />
          <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#fff", padding: "0 12px", fontSize: "13px", color: "#999" }}>
            Hoặc đăng nhập với PinkyCloud
          </span>
        </div>

        {/* Input email/SĐT */}
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Nhập email hoặc số điện thoại"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Input mật khẩu */}
        <div style={{ marginBottom: "10px" }}>
          <input
            type="password"
            placeholder="Nhập password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNormalLogin()}
            style={inputStyle}
          />
        </div>

        {/* Nhớ mật khẩu / Quên mật khẩu */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "13px" }}>
          <label style={{ cursor: "pointer" }}><input type="checkbox" /> Nhớ mật khẩu</label>
          <span style={{ color: "#999", cursor: "pointer" }}>Quên mật khẩu</span>
        </div>

        {/* Hint tài khoản test */}
        <div style={{ background: "#fff8e1", border: "1px dashed #ffc107", borderRadius: "6px", padding: "8px 12px", marginBottom: "14px", fontSize: "12px", color: "#795548" }}>
          💡 <b>Tài khoản test:</b> <code>test@gmail.com</code> / <code>123456</code>
        </div>

        {/* Nút đăng nhập thường */}
        <button
          onClick={handleNormalLogin}
          disabled={!!loading}
          style={{
            width: "100%", padding: "12px", background: loading === "normal" ? "#aaa" : "#326e51",
            color: "#fff", border: "none", borderRadius: "25px", fontSize: "15px", fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer", marginBottom: "14px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "background 0.2s",
          }}
        >
          {loading === "normal" ? <><Spinner /> Đang đăng nhập...</> : "Đăng nhập"}
        </button>

        <p style={{ textAlign: "center", fontSize: "14px", margin: 0, color: "#333" }}>
          Bạn chưa có tài khoản?{" "}
          <span onClick={onSwitchToRegister} style={{ color: "#326e51", fontWeight: 700, cursor: "pointer" }}>
            ĐĂNG KÝ NGAY
          </span>
        </p>
      </div>
    </div>
  );
}

// --- Helper components ---
function Spinner({ color = "#fff" }) {
  return (
    <span style={{
      width: "16px", height: "16px", border: `2px solid ${color}`,
      borderTopColor: "transparent", borderRadius: "50%",
      display: "inline-block", animation: "spin 0.7s linear infinite",
    }} />
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// CSS cho animation spinner (thêm vào index.css hoặc App.css nếu chưa có)
const styleTag = document.createElement("style");
styleTag.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleTag);