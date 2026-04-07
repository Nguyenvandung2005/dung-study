import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();

  const handleRegister = (event) => {
    event.preventDefault();

    // Validate form
    if (!username || !email || !password || !confirmPassword) {
      setNotification("Vui lòng điền đầy đủ tất cả các trường!");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNotification("Email không hợp lệ!");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setNotification("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setNotification("Mật khẩu không trùng khớp!");
      return;
    }

    // Show success modal
    setShowSuccessModal(true);
    setNotification("Đăng ký thành công!");

    // Redirect after 2 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
      navigate("/login");
    }, 2000);

    // Reset form
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div>
      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: notification.includes("không") ? "#dc3545" : "#28a745",
            color: "white",
            padding: "15px 20px",
            borderRadius: "5px",
            zIndex: 9999,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}
        >
          {notification}
        </div>
      )}

      {/* Register Section */}
      <div style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        backgroundColor: "#f9f9f9",
        padding: "40px 0"
      }}>
        <div className="container">
          <div className="row align-items-center">
            {/* Left Column */}
            <div className="col-md-6 mb-4 mb-md-0" style={{ textAlign: "center" }}>
              <h1 style={{
                fontSize: "42px",
                fontWeight: "bold",
                color: "#333",
                marginBottom: "30px"
              }}>
                Tạo tài khoản
              </h1>
              <div className="social-icons" style={{
                display: "flex",
                justifyContent: "center",
                gap: "20px"
              }}>
                <a href="#" style={{
                  fontSize: "32px",
                  color: "#E23E8C",
                  transition: "all 0.3s ease"
                }} onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"} onMouseLeave={(e) => e.target.style.transform = "scale(1)"}>
                  <i className="bi bi-facebook"></i>
                </a>
                <a href="#" style={{
                  fontSize: "32px",
                  color: "#E23E8C",
                  transition: "all 0.3s ease"
                }} onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"} onMouseLeave={(e) => e.target.style.transform = "scale(1)"}>
                  <i className="bi bi-twitter"></i>
                </a>
                <a href="#" style={{
                  fontSize: "32px",
                  color: "#E23E8C",
                  transition: "all 0.3s ease"
                }} onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"} onMouseLeave={(e) => e.target.style.transform = "scale(1)"}>
                  <i className="bi bi-instagram"></i>
                </a>
                <a href="#" style={{
                  fontSize: "32px",
                  color: "#E23E8C",
                  transition: "all 0.3s ease"
                }} onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"} onMouseLeave={(e) => e.target.style.transform = "scale(1)"}>
                  <i className="bi bi-youtube"></i>
                </a>
              </div>
            </div>

            {/* Right Column - Register Form */}
            <div className="col-md-6">
              <div style={{
                backgroundColor: "white",
                padding: "40px",
                borderRadius: "10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
              }}>
                <h2 style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#333",
                  marginBottom: "30px"
                }}>
                  Đăng ký
                </h2>

                <form onSubmit={handleRegister}>
                  {/* Username Input */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#333"
                    }}>
                      Tên đăng nhập
                    </label>
                    <input
                      type="text"
                      placeholder="Tên đăng nhập"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 15px",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        transition: "border-color 0.3s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#E23E8C"}
                      onBlur={(e) => e.target.style.borderColor = "#ddd"}
                      required
                    />
                  </div>

                  {/* Email Input */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#333"
                    }}>
                      Địa chỉ email
                    </label>
                    <input
                      type="email"
                      placeholder="Địa chỉ email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 15px",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        transition: "border-color 0.3s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#E23E8C"}
                      onBlur={(e) => e.target.style.borderColor = "#ddd"}
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#333"
                    }}>
                      Mật khẩu
                    </label>
                    <input
                      type="password"
                      placeholder="Mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 15px",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        transition: "border-color 0.3s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#E23E8C"}
                      onBlur={(e) => e.target.style.borderColor = "#ddd"}
                      required
                    />
                  </div>

                  {/* Confirm Password Input */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{
                      display: "block",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#333"
                    }}>
                      Nhập lại mật khẩu
                    </label>
                    <input
                      type="password"
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 15px",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        transition: "border-color 0.3s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#E23E8C"}
                      onBlur={(e) => e.target.style.borderColor = "#ddd"}
                      required
                    />
                  </div>

                  {/* Buttons */}
                  <div className="row" style={{ marginBottom: "20px", gap: "10px" }}>
                    <div className="col-6">
                      <button
                        type="submit"
                        style={{
                          width: "100%",
                          padding: "12px 20px",
                          backgroundColor: "#E23E8C",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          fontSize: "15px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          transition: "background-color 0.3s"
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#c8306a"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#E23E8C"}
                      >
                        Đăng ký ngay!
                      </button>
                    </div>
                    <div className="col-6">
                      <Link
                        to="/login"
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "12px 20px",
                          backgroundColor: "#fff",
                          color: "#E23E8C",
                          border: "2px solid #E23E8C",
                          borderRadius: "5px",
                          fontSize: "15px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          textAlign: "center",
                          textDecoration: "none",
                          transition: "all 0.3s",
                          boxSizing: "border-box"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#E23E8C";
                          e.target.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#fff";
                          e.target.style.color = "#E23E8C";
                        }}
                      >
                        Đăng nhập
                      </Link>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <p style={{
                    fontSize: "12px",
                    color: "#666",
                    lineHeight: "1.6",
                    textAlign: "center",
                    marginBottom: 0
                  }}>
                    Bằng cách nhấn vào "Đăng ký ngay!", bạn đã đồng ý với{" "}
                    <a href="#" style={{ color: "#E23E8C", textDecoration: "none" }}>
                      Điều khoản dịch vụ
                    </a>
                    {" "}| {" "}
                    <a href="#" style={{ color: "#E23E8C", textDecoration: "none" }}>
                      Chính sách bảo mật
                    </a>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9998
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            padding: "40px",
            maxWidth: "400px",
            width: "90%",
            textAlign: "center"
          }}>
            <h5 style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#333",
              marginBottom: "15px"
            }}>
              Đăng ký thành công
            </h5>
            <p style={{
              fontSize: "15px",
              color: "#666",
              marginBottom: "25px",
              lineHeight: "1.6"
            }}>
              Chúc mừng! Bạn đã đăng ký thành công. Bạn sẽ được chuyển hướng về trang đăng nhập trong giây lát...
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/login");
              }}
              style={{
                padding: "10px 30px",
                backgroundColor: "#E23E8C",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background-color 0.3s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#c8306a"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#E23E8C"}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
