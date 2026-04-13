import React, { useState } from "react";
import { Link } from "react-router-dom";
import { isContactTaken, registerUser } from "../hooks/userStorage.jsx";

// Hàm hỗ trợ tạo mã Captcha ngẫu nhiên gồm 5 ký tự
function generateCaptcha() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function RegisterModal({ show, onClose, onSwitchToLogin }) {
  // --- QUẢN LÝ CÁC TRẠNG THÁI (STATE) ---
  const [gender, setGender] = useState("nu");
  const [agreed, setAgreed] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0); // Đếm ngược gửi lại OTP
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [errors, setErrors] = useState({}); // Lưu trữ các lỗi nhập liệu
  const [simulatedOtp, setSimulatedOtp] = useState(""); // Lưu OTP giả lập để kiểm tra
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Nếu không ở trạng thái hiển thị (show = false) thì không render modal
  if (!show) return null;

  // Khởi tạo dữ liệu cho các ô chọn Ngày/Tháng/Năm
  const days = Array.from({ length: 31 }, (_, index) => index + 1);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, index) => currentYear - index);

  // --- HÀM KIỂM TRA LỖI NHẬP LIỆU (VALIDATION) ---
  function validate() {
    const nextErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;

    // Kiểm tra Email/SĐT
    if (!contact.trim()) nextErrors.contact = "Vui lòng nhập email hoặc số điện thoại.";
    else if (!emailRegex.test(contact) && !phoneRegex.test(contact)) nextErrors.contact = "Email hoặc số điện thoại không hợp lệ.";

    // Kiểm tra Captcha
    if (!captchaInput.trim()) nextErrors.captcha = "Vui lòng nhập mã captcha.";
    else if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) nextErrors.captcha = "Mã captcha không đúng.";

    // Kiểm tra mã OTP
    if (!otp.trim()) nextErrors.otp = "Vui lòng nhập mã OTP.";
    else if (!/^\d{6}$/.test(otp)) nextErrors.otp = "Mã OTP phải gồm đúng 6 chữ số.";
    else if (otp !== simulatedOtp) nextErrors.otp = "Mã OTP không đúng. Vui lòng kiểm tra lại.";

    // Kiểm tra mật khẩu (độ dài 6-32 ký tự)
    if (!password) nextErrors.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 6 || password.length > 32) nextErrors.password = "Mật khẩu phải từ 6 đến 32 ký tự.";

    // Xác nhận mật khẩu
    if (!confirmPassword) nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    else if (confirmPassword !== password) nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";

    // Kiểm tra họ tên
    if (!name.trim()) nextErrors.name = "Vui lòng nhập họ tên.";
    else if (name.trim().length < 2) nextErrors.name = "Họ tên phải có ít nhất 2 ký tự.";

    // Kiểm tra ngày sinh (yêu cầu trên 13 tuổi)
    if (!day || !month || !year) nextErrors.dob = "Vui lòng chọn đầy đủ ngày sinh.";
    else if (currentYear - parseInt(year, 10) < 13) nextErrors.dob = "Bạn phải từ 13 tuổi trở lên để đăng ký.";

    // Kiểm tra các hộp chọn đồng ý điều khoản
    if (!agreed) nextErrors.agreed = "Bạn cần đồng ý với điều khoản để tiếp tục.";
    if (!privacy) nextErrors.privacy = "Bạn cần đồng ý với chính sách xử lý dữ liệu.";

    return nextErrors;
  }

  // --- HÀM XỬ LÝ GỬI MÃ OTP GIẢ LẬP ---
  async function handleSendOtp() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;

    if (!contact.trim() || (!emailRegex.test(contact) && !phoneRegex.test(contact))) {
      setErrors((prev) => ({ ...prev, contact: "Vui lòng nhập email hoặc SĐT hợp lệ trước khi lấy mã." }));
      return;
    }

    if (!captchaInput || captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
      setErrors((prev) => ({ ...prev, captcha: "Vui lòng nhập đúng captcha trước khi lấy mã OTP." }));
      return;
    }

    // Kiểm tra xem Email/SĐT này đã có người dùng chưa
    if (isContactTaken(contact.trim())) {
      setErrors((prev) => ({ ...prev, contact: "Email hoặc SĐT này đã được đăng ký. Vui lòng đăng nhập." }));
      return;
    }

    setErrors((prev) => ({ ...prev, contact: undefined, captcha: undefined, otp: undefined }));

    // Tạo mã OTP ngẫu nhiên 6 chữ số và bắt đầu đếm ngược 60 giây
    const fakeOtp = String(Math.floor(100000 + Math.random() * 900000));
    setSimulatedOtp(fakeOtp);
    setOtpSent(true);
    setOtpCountdown(60);

    const timer = setInterval(() => {
      setOtpCountdown((countdown) => {
        if (countdown <= 1) {
          clearInterval(timer);
          return 0;
        }
        return countdown - 1;
      });
    }, 1000);
  }

  // --- HÀM XỬ LÝ KHI BẤM NÚT ĐĂNG KÝ ---
  async function handleSubmit() {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return; // Nếu có lỗi thì dừng lại

    setSubmitting(true);

    try {
      // Gọi hàm lưu người dùng vào LocalStorage
      const result = registerUser({
        contact,
        password,
        name,
        gender,
        newsletter,
        dob: `${day}/${month}/${year}`,
      });

      if (!result.success) {
        setErrors((prev) => ({ ...prev, contact: result.error }));
        return;
      }

      setRegisterSuccess(true); // Hiển thị thông báo đăng ký thành công
    } finally {
      setSubmitting(false);
    }
  }

  // Hàm làm mới mã Captcha
  function refreshCaptcha() {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
    setErrors((prev) => ({ ...prev, captcha: undefined }));
  }

  // Cấu trúc CSS Inline cơ bản cho giao diện
  const inputBase = {
    width: "100%", padding: "10px 14px", border: "1px solid #e0e0e0",
    borderRadius: "6px", fontSize: "14px", outline: "none",
    backgroundColor: "#fff", color: "#333", boxSizing: "border-box",
  };
  const inputErr = { ...inputBase, border: "1px solid #e53935", background: "#fff5f5" };
  const errText = { fontSize: "12px", color: "#e53935", marginTop: "3px" };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "460px", maxHeight: "92vh", overflowY: "auto", padding: "28px 32px 24px", position: "relative", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>

        {/* Nút đóng X ở góc trên bên phải */}
        <button onClick={onClose} style={{ position: "absolute", top: "14px", right: "16px", background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#888" }}>×</button>

        {registerSuccess ? (
          /* GIAO DIỆN KHI ĐĂNG KÝ THÀNH CÔNG */
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fff0f3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 36 }}>✔</div>
            <h5 style={{ fontWeight: 800, color: "#ff6b81", marginBottom: 8 }}>Đăng ký thành công!</h5>
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 8 }}>
              Xin chào <b>{name}</b>! Tài khoản của bạn đã được tạo trên trình duyệt này.
            </p>
            <div style={{ background: "#fff8e1", border: "1px dashed #ffc107", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#795548", marginBottom: 20, textAlign: "left" }}>
              Tài khoản: <b>{contact}</b>
            </div>
            <button onClick={() => { setRegisterSuccess(false); onSwitchToLogin(); }}
              style={{ width: "100%", padding: "13px", background: "#ff6b81", color: "#fff", border: "none", borderRadius: "25px", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>
              Đăng nhập ngay
            </button>
            <button onClick={onClose}
              style={{ width: "100%", padding: "11px", background: "#f5f5f5", color: "#555", border: "none", borderRadius: "25px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
              Về trang chủ
            </button>
          </div>
        ) : (
          /* GIAO DIỆN FORM ĐĂNG KÝ */
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h5 style={{ fontWeight: 700, fontSize: "17px", color: "#222" }}>ĐĂNG KÝ TÀI KHOẢN</h5>
            </div>

            {/* Ô nhập Email hoặc Số điện thoại */}
            <div style={{ marginBottom: "12px" }}>
              <input type="text" placeholder="Nhập email hoặc số điện thoại *" value={contact}
                onChange={(e) => { setContact(e.target.value); setErrors((prev) => ({ ...prev, contact: undefined })); }}
                style={errors.contact ? inputErr : inputBase} />
              {errors.contact && <div style={errText}>{errors.contact}</div>}
            </div>

            {/* Ô nhập Captcha và hình ảnh mã */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                <input type="text" placeholder="Nhập mã captcha *" value={captchaInput}
                  onChange={(e) => { setCaptchaInput(e.target.value); setErrors((prev) => ({ ...prev, captcha: undefined })); }}
                  style={{ ...(errors.captcha ? inputErr : inputBase), flex: 1, width: "auto" }} />
                <div style={{ background: "#1b4332", color: "#fff", fontWeight: 700, fontSize: "17px", padding: "10px 14px", borderRadius: "6px", letterSpacing: "5px", fontFamily: "monospace", userSelect: "none", display: "flex", alignItems: "center" }}>
                  {captchaCode}
                </div>
                <button onClick={refreshCaptcha} title="Làm mới" style={{ background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "6px", padding: "0 12px", cursor: "pointer", fontSize: "18px" }}>↻</button>
              </div>
              {errors.captcha && <div style={errText}>{errors.captcha}</div>}
            </div>

            {/* Ô nhập mã OTP */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="text" placeholder="Nhập mã OTP 6 số *" value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrors((prev) => ({ ...prev, otp: undefined })); }}
                  maxLength={6} style={{ ...(errors.otp ? inputErr : inputBase), flex: 1, width: "auto" }} />
                <button onClick={handleSendOtp} disabled={otpCountdown > 0}
                  style={{ background: otpCountdown > 0 ? "#ccc" : "#ff6b81", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 12px", fontSize: "13px", fontWeight: 600, cursor: otpCountdown > 0 ? "not-allowed" : "pointer", whiteSpace: "nowrap", minWidth: "90px" }}>
                  {otpCountdown > 0 ? `Gửi lại (${otpCountdown}s)` : "Lấy mã OTP"}
                </button>
              </div>
              {errors.otp && <div style={errText}>{errors.otp}</div>}
              {/* Hiển thị mã OTP giả lập cho mục đích demo */}
              {otpSent && simulatedOtp && (
                <div style={{ marginTop: "6px", padding: "10px 14px", background: "#fff0f3", border: "1px dashed #ff6b81", borderRadius: "6px", fontSize: "13px", color: "#c2185b" }}>
                  Mã OTP gửi đến <b>{contact}</b>:
                  <div style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "8px", marginTop: "4px", fontFamily: "monospace" }}>{simulatedOtp}</div>
                  <div style={{ fontSize: "11px", color: "#888" }}>(Hệ thống thử nghiệm, thực tế sẽ gửi qua email/SMS)</div>
                </div>
              )}
            </div>

            {/* Ô nhập mật khẩu */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} placeholder="Mật khẩu từ 6 - 32 ký tự *"
                  value={password} onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                  style={{ ...(errors.password ? inputErr : inputBase), paddingRight: "40px" }} />
                <button onClick={() => setShowPassword((value) => !value)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", fontSize: "13px" }}>
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {errors.password && <div style={errText}>{errors.password}</div>}
            </div>

            {/* Ô xác nhận mật khẩu */}
            <div style={{ marginBottom: "12px" }}>
              <input type="password" placeholder="Xác nhận mật khẩu *" value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: undefined })); }}
                style={errors.confirmPassword ? inputErr : inputBase} />
              {errors.confirmPassword && <div style={errText}>{errors.confirmPassword}</div>}
            </div>

            {/* Ô nhập họ và tên */}
            <div style={{ marginBottom: "12px" }}>
              <input type="text" placeholder="Họ và tên *" value={name}
                onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })); }}
                style={errors.name ? inputErr : inputBase} />
              {errors.name && <div style={errText}>{errors.name}</div>}
            </div>

            {/* Lựa chọn giới tính */}
            <div style={{ marginBottom: "12px", display: "flex", gap: "20px" }}>
              {[{ value: "khong_xac_dinh", label: "Khác" }, { value: "nam", label: "Nam" }, { value: "nu", label: "Nữ" }].map((option) => (
                <label key={option.value} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", fontSize: "14px" }}>
                  <input type="radio" name="gender" value={option.value} checked={gender === option.value} onChange={() => setGender(option.value)} style={{ accentColor: "#ff6b81" }} />
                  {option.label}
                </label>
              ))}
            </div>

            {/* Ô chọn ngày sinh */}
            <div style={{ marginBottom: "4px", display: "flex", gap: "8px" }}>
              {[
                { label: "Ngày", value: day, setter: setDay, options: days },
                { label: "Tháng", value: month, setter: setMonth, options: months },
                { label: "Năm", value: year, setter: setYear, options: years },
              ].map((item) => (
                <select key={item.label} value={item.value}
                  onChange={(e) => { item.setter(e.target.value); setErrors((prev) => ({ ...prev, dob: undefined })); }}
                  style={{ flex: 1, padding: "10px 8px", border: `1px solid ${errors.dob ? "#e53935" : "#e0e0e0"}`, borderRadius: "6px", fontSize: "14px", color: item.value ? "#333" : "#999", background: "#fff", cursor: "pointer" }}>
                  <option value="">{item.label}</option>
                  {item.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ))}
            </div>
            {errors.dob && <div style={{ ...errText, marginBottom: "8px" }}>{errors.dob}</div>}

            <div style={{ borderTop: "1px solid #f0f0f0", margin: "14px 0" }} />

            {/* KHỐI CÁC ĐIỀU KHOẢN VÀ CHÍNH SÁCH */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((prev) => ({ ...prev, agreed: undefined })); }}
                  style={{ marginTop: "2px", accentColor: "#ff6b81", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "#333", lineHeight: "1.5" }}>
                  Tôi đã đọc và đồng ý với{" "}
                  <Link to="/chinh-sach/dieu-kien-giao-dich-chung" target="_blank" style={{ color: "#ff6b81", fontWeight: 600 }}>Điều kiện giao dịch chung</Link>
                  {" "}và{" "}
                  <Link to="/chinh-sach/chinh-sach-bao-mat" target="_blank" style={{ color: "#ff6b81", fontWeight: 600 }}>Chính sách bảo mật</Link>
                </span>
              </label>
              {errors.agreed && <div style={{ ...errText, marginLeft: "24px", marginBottom: "6px" }}>{errors.agreed}</div>}

              <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px", cursor: "pointer" }}>
                <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} style={{ marginTop: "2px", accentColor: "#ff6b81", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "#333" }}>
                  Nhận thông tin khuyến mãi qua e-mail -{" "}
                  <Link to="/chinh-sach/chinh-sach-khuyen-mai" target="_blank" style={{ color: "#ff6b81", fontWeight: 600 }}>Xem chính sách</Link>
                </span>
              </label>

              <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", cursor: "pointer" }}>
                <input type="checkbox" checked={privacy} onChange={(e) => { setPrivacy(e.target.checked); setErrors((prev) => ({ ...prev, privacy: undefined })); }}
                  style={{ marginTop: "2px", accentColor: "#ff6b81", flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: "#333" }}>
                  Tôi đồng ý với{" "}
                  <Link to="/chinh-sach/chinh-sach-du-lieu-ca-nhan" target="_blank" style={{ color: "#ff6b81", fontWeight: 600 }}>chính sách xử lý dữ liệu cá nhân</Link>
                </span>
              </label>
              {errors.privacy && <div style={{ ...errText, marginLeft: "24px", marginTop: "4px" }}>{errors.privacy}</div>}
            </div>

            {/* Nút hoàn tất đăng ký */}
            <button onClick={handleSubmit} disabled={submitting}
              style={{ width: "100%", padding: "13px", background: submitting ? "#ccc" : "#ff6b81", color: "#fff", border: "none", borderRadius: "25px", fontSize: "15px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", marginBottom: "14px" }}>
              {submitting ? "Đang tạo tài khoản..." : "ĐĂNG KÝ"}
            </button>

            <p style={{ textAlign: "center", fontSize: "14px", margin: "0 0 10px", color: "#333" }}>
              Bạn đã có tài khoản?{" "}
              <span onClick={onSwitchToLogin} style={{ color: "#ff6b81", fontWeight: 700, cursor: "pointer" }}>ĐĂNG NHẬP</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}