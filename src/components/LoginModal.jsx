import React, { useState } from "react";
import { loginUser } from "../utils/userStorage";

// Thông tin giả lập OAuth
const FAKE_GOOGLE_USER = { name: "Nguyễn Google", email: "user@gmail.com" };
const FAKE_FACEBOOK_USER = { name: "Nguyễn Facebook", email: "user@facebook.com" };

export default function LoginModal({ show, onClose, onLoginSuccess, onSwitchToRegister }) {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!show) return null;

  // ── OAuth giả lập ──
  const simulateOAuth = (provider) => {
    setError(""); setLoading(provider); setSuccessMsg("");
    setTimeout(() => {
      const fakeUser = provider === "google" ? FAKE_GOOGLE_USER : FAKE_FACEBOOK_USER;
      setLoading(null);
      setSuccessMsg(`✅ Đăng nhập bằng ${provider === "google" ? "Google" : "Facebook"} thành công!`);
      setTimeout(() => onLoginSuccess(fakeUser), 900);
    }, 1500);
  };

  // ── Đăng nhập thường — kiểm tra localStorage ──
  const handleNormalLogin = () => {
    setError("");
    if (!emailInput.trim() || !passwordInput) {
      setError("Vui lòng nhập email/SĐT và mật khẩu.");
      return;
    }
    setLoading("normal");
    setTimeout(() => {
      const result = loginUser(emailInput.trim(), passwordInput);
      setLoading(null);
      if (result.success) {
        setSuccessMsg(`✅ Đăng nhập thành công! Xin chào ${result.user.name}`);
        setTimeout(() => onLoginSuccess(result.user), 900);
      } else {
        setError(`❌ ${result.error}`);
      }
    }, 800);
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px",
    border: "1px solid #e0e0e0", borderRadius: "8px",
    fontSize: "14px", outline: "none",
    backgroundColor: "#fafafa", color: "#333",
    boxSizing: "border-box",
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "420px", padding: "28px 32px 24px", position: "relative", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>

        <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "16px", background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#888" }}>×</button>

        <h5 style={{ textAlign: "center", fontWeight: 700, fontSize: "18px", marginBottom: "20px", color: "#222" }}>Đăng nhập</h5>

        {/* Thông báo thành công */}
        {successMsg && (
          <div style={{ background: "#fff0f3", color: "#c2185b", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "14px", textAlign: "center", fontWeight: 600 }}>
            {successMsg}
          </div>
        )}

        {/* Thông báo lỗi */}
        {error && (
          <div style={{ background: "#fdecea", color: "#c62828", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* Nút Facebook */}
        <button onClick={() => simulateOAuth("facebook")} disabled={!!loading}
          style={{ width: "100%", padding: "11px", background: loading === "facebook" ? "#aac4f0" : "#1877f2", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          {loading === "facebook" ? <><Spinner /> Đang kết nối...</> : <><FbIcon /> Facebook</>}
        </button>

        {/* Nút Google */}
        <button onClick={() => simulateOAuth("google")} disabled={!!loading}
          style={{ width: "100%", padding: "11px", background: "#fff", color: "#333", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          {loading === "google" ? <><Spinner color="#4285F4" /> Đang kết nối...</> : <><GoogleIcon /> Đăng nhập bằng Google</>}
        </button>

        {/* Divider */}
        <div style={{ position: "relative", textAlign: "center", marginBottom: "16px" }}>
          <hr style={{ borderColor: "#eee" }} />
          <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", padding: "0 12px", fontSize: "13px", color: "#999" }}>
            Hoặc đăng nhập bằng tài khoản
          </span>
        </div>

        {/* Input email/SĐT */}
        <div style={{ marginBottom: "10px" }}>
          <input type="text" placeholder="Email hoặc số điện thoại" value={emailInput}
            onChange={e => { setEmailInput(e.target.value); setError(""); }}
            style={inputStyle} />
        </div>

        {/* Input mật khẩu */}
        <div style={{ marginBottom: "10px", position: "relative" }}>
          <input type={showPassword ? "text" : "password"} placeholder="Mật khẩu"
            value={passwordInput}
            onChange={e => { setPasswordInput(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleNormalLogin()}
            style={{ ...inputStyle, paddingRight: "40px" }} />
          <button onClick={() => setShowPassword(s => !s)}
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "16px" }}>
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>

        {/* Nhớ mật khẩu / Quên mật khẩu */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "13px" }}>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" style={{ accentColor: "#ff6b81" }} /> Nhớ mật khẩu
          </label>
          <span style={{ color: "#ff6b81", cursor: "pointer", fontWeight: 600 }}>Quên mật khẩu?</span>
        </div>

        {/* Nút đăng nhập */}
        <button onClick={handleNormalLogin} disabled={!!loading}
          style={{ width: "100%", padding: "13px", background: loading === "normal" ? "#ccc" : "#ff6b81", color: "#fff", border: "none", borderRadius: "25px", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          {loading === "normal" ? <><Spinner /> Đang đăng nhập...</> : "Đăng nhập"}
        </button>

        <p style={{ textAlign: "center", fontSize: "14px", margin: 0, color: "#333" }}>
          Chưa có tài khoản?{" "}
          <span onClick={onSwitchToRegister} style={{ color: "#ff6b81", fontWeight: 700, cursor: "pointer" }}>
            ĐĂNG KÝ NGAY
          </span>
        </p>
      </div>
    </div>
  );
}

function Spinner({ color = "#fff" }) {
  return <span style={{ width: 16, height: 16, border: `2px solid ${color}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />;
}

function FbIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" /></svg>;
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

const s = document.createElement("style");
s.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
if (!document.head.querySelector("[data-login-spin]")) { s.setAttribute("data-login-spin", "1"); document.head.appendChild(s); }