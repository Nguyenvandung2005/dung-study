import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();

  const handleLogin = (event) => {
    event.preventDefault();

    // Validate form
    if (!email || !password) {
      setNotification("Vui lòng điền đầy đủ email và mật khẩu!");
      return;
    }

    // Show success modal
    setShowSuccessModal(true);
    setNotification("Đăng nhập thành công!");

    // Redirect after 2 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
      navigate("/");
    }, 2000);

    // Reset form
    setEmail("");
    setPassword("");
    setRemember(false);
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
            backgroundColor: "#28a745",
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

      {/* Login Section */}
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
                Chào mừng trở lại
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

            {/* Right Column - Login Form */}
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
                  Đăng nhập
                </h2>

                <form onSubmit={handleLogin}>
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

                  {/* Remember Checkbox */}
                  <div style={{
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    <input
                      type="checkbox"
                      id="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      style={{
                        marginRight: "8px",
                        width: "18px",
                        height: "18px",
                        cursor: "pointer"
                      }}
                    />
                    <label htmlFor="remember" style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#666",
                      cursor: "pointer"
                    }}>
                      Nhớ mật khẩu
                    </label>
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
                        Đăng nhập ngay!
                      </button>
                    </div>
                    <div className="col-6">
                      <Link
                        to="/register"
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
                        Đăng ký
                      </Link>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div style={{ marginBottom: "20px", textAlign: "center" }}>
                    <a href="#" style={{
                      color: "#E23E8C",
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "text-decoration 0.3s"
                    }} onMouseEnter={(e) => e.target.style.textDecoration = "underline"} onMouseLeave={(e) => e.target.style.textDecoration = "none"}>
                      Quên mật khẩu?
                    </a>
                  </div>

                  {/* Terms & Conditions */}
                  <p style={{
                    fontSize: "12px",
                    color: "#666",
                    lineHeight: "1.6",
                    textAlign: "center",
                    marginBottom: 0
                  }}>
                    Bằng cách nhấn vào "Đăng nhập ngay!", bạn đã đồng ý với{" "}
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
              Đăng nhập thành công
            </h5>
            <p style={{
              fontSize: "15px",
              color: "#666",
              marginBottom: "25px",
              lineHeight: "1.6"
            }}>
              Chúc mừng! Bạn đã đăng nhập thành công. Bạn sẽ được chuyển hướng về trang chủ trong giây lát...
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
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
