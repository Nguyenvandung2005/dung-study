import React, { useState, useEffect } from "react";
import { getUsers } from "../hooks/userStorage";

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "14px",
    backgroundColor: "#fafafa",
    boxSizing: "border-box",
  };

  useEffect(() => {
  if (countdown <= 0) return;

  const timer = setTimeout(() => {
    setCountdown(countdown - 1);
  }, 1000);

  return () => clearTimeout(timer);
}, [countdown]);

  const handleReset = () => {
    setError("");
    setSuccess("");

    if (!email.trim() || !newPassword || !confirmPassword || !otp) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (otp !== generatedOtp) {
      setError("Mã OTP không đúng.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const USERS_KEY = "pinkycloud_users";
      const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
      const userIndex = users.findIndex(
  (u) => u.contact.toLowerCase() === email.trim().toLowerCase()
);

      if (userIndex === -1) {
        setError("Email không tồn tại.");
        setLoading(false);
        return;
      }

      users[userIndex].password = newPassword;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      setSuccess("✅ Đổi mật khẩu thành công!");
      setLoading(false);

      setTimeout(() => {
        onClose();
      }, 1200);
    }, 800);
  };

  const handleGetOtp = () => {
  if (!email.trim()) {
    setError("Vui lòng nhập email trước khi lấy mã OTP.");
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  setGeneratedOtp(code);
  setShowOtp(true);
  setSuccess("📩 Mã OTP đã được tạo");
  setCountdown(60);    
};

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "420px",
          padding: "28px 32px 24px",
          position: "relative",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Close */}
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
          }}
        >
          Quên mật khẩu
        </h5>

        {/* SUCCESS */}
        {success && (
          <div
            style={{
              background: "#fff0f3",
              color: "#c2185b",
              borderRadius: "8px",
              padding: "10px",
              marginBottom: "12px",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {success}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div
            style={{
              background: "#fdecea",
              color: "#c62828",
              borderRadius: "8px",
              padding: "10px",
              marginBottom: "12px",
            }}
          >
            {error}
          </div>
        )}

        {/* EMAIL */}
        <div style={{ marginBottom: "10px" }}>
          <input
            type="email"
            placeholder="Nhập email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            style={inputStyle}
          />
        </div>

        {/* OTP */}
<div style={{ marginBottom: "10px", display: "flex", gap: "8px" }}>
  <input
    type="text"
    placeholder="Nhập mã OTP"
    value={otp}
    onChange={(e) => {
      setOtp(e.target.value);
      setError("");
    }}
    style={{ ...inputStyle, flex: 1 }}
  />

  <button
  onClick={handleGetOtp}
  disabled={countdown > 0}
  style={{
    padding: "0 12px",
    border: "none",
    borderRadius: "8px",
    background: countdown > 0 ? "#ccc" : "#ff6b81",
    color: "#fff",
    fontSize: "13px",
    cursor: countdown > 0 ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
  }}
>
  {countdown > 0 ? `Gửi lại (${countdown}s)` : "Lấy mã"}
</button>
   <div>
  </div>
</div>

    <div>
        {showOtp && (
  <div
    style={{
      background: "#fff0f3",
      color: "#c2185b",
      borderRadius: "8px",
      padding: "10px",
      marginBottom: "12px",
      textAlign: "center",
      fontWeight: 700,
      letterSpacing: "2px",
    }}
  >
    🔑 OTP: {generatedOtp}
  </div>
)}
    </div>

        {/* PASSWORD */}
        <div style={{ marginBottom: "10px", position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError("");
            }}
            style={{ ...inputStyle, paddingRight: "40px" }}
          />
          <button
            onClick={() => setShowPassword((s) => !s)}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>

        {/* CONFIRM PASSWORD */}
        <div style={{ marginBottom: "16px" }}>
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            style={inputStyle}
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={handleReset}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            background: loading ? "#ccc" : "#ff6b81",
            color: "#fff",
            border: "none",
            borderRadius: "25px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </div>
    </div>
  );
}