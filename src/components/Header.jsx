import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "../css/Header.css";
import { useCart } from "./CartContext";
import megaMenuData from "../data/megaMenu.json";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";

export default function Header({
  searchValue = "",
  onSearchChange = () => { },
  onSearchSubmit = () => { },
}) {
  // --- 1. LẤY DỮ LIỆU TỪ GIỎ HÀNG VÀ AUTHENTICATION ---
  const cartData = useCart();
  const cartList = cartData.cart || cartData.cartItems || [];

  // Tính tổng số lượng sản phẩm để hiển thị trên Badge giỏ hàng
  const totalItems = cartData.cartCount !== undefined
    ? cartData.cartCount
    : cartList.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // --- 2. QUẢN LÝ TRẠNG THÁI GIAO DIỆN (UI STATE) ---
  const [showMegaMenu, setShowMegaMenu] = useState(false); // Hiện/ẩn menu danh mục lớn
  const [navExpanded, setNavExpanded] = useState(false);   // Bật/tắt menu trên mobile
  const [showLoginModal, setShowLoginModal] = useState(false);       // Hiện/ẩn bảng Đăng nhập
  const [showRegisterModal, setShowRegisterModal] = useState(false); // Hiện/ẩn bảng Đăng ký

  // Hàm mở bảng Đăng nhập và đóng bảng Đăng ký
  const openLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
    setNavExpanded(false);
  };

  // Hàm mở bảng Đăng ký và đóng bảng Đăng nhập
  const openRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
    setNavExpanded(false);
  };

  // Xử lý sau khi người dùng đăng nhập thành công
  const handleLoginSuccess = (userInfo, token) => {
    if (cartData.login) {
      cartData.login(userInfo || {}, token || ""); // Cập nhật thông tin vào Context
    }
    setShowLoginModal(false); // Đóng bảng đăng nhập
  };

  return (
    <header className="site-header">
      {/* PHẦN TRÊN CÙNG: Logo và Thông tin thương hiệu */}
      <div className="container-fluid px-3 px-lg-4 px-xl-5">
        <div className="row align-items-center header-top gy-3">
          {/* Khu vực Logo */}
          <div className="col-12 col-md-auto text-center text-md-start">
            <div className="logo">
              <Link to="/" className="logo-link">
                <img src="/IMG/logo.jpg" alt="PinkyCloud" className="header-logo" />
              </Link>
            </div>
          </div>

          {/* Slogan thương hiệu */}
          <div className="col-12 col-xl text-center">
            <div className="header-center-brand">
              <div className="header-brand-tag">MỸ PHẨM CHÍNH HÃNG • CHĂM SÓC DA CAO CẤP</div>
              <div className="header-brand-subtitle">Nâng tầm trải nghiệm làm đẹp mỗi ngày</div>
            </div>
          </div>

          {/* Mạng xã hội */}
          <div className="col-12 col-xl-auto">
            <div className="d-flex align-items-center justify-content-center justify-content-xl-end gap-3 header-social-wrap">
              <span className="social-text">Theo dõi chúng tôi</span>
              <div className="d-flex gap-2 social-list">
                <a href="#" className="social-link"><img src="/IMG/fb.png" alt="FB" className="social-icon" /></a>
                <a href="#" className="social-link"><img src="/IMG/ins.png" alt="Instagram" className="social-icon" /></a>
                <a href="#" className="social-link"><img src="/IMG/tt.png" alt="TikTok" className="social-icon" /></a>
                <a href="#" className="social-link"><img src="/IMG/ytb.png" alt="YouTube" className="social-icon" /></a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THANH MENU CHÍNH (NAVBAR) */}
      <div className="container-fluid px-3 px-lg-4 px-xl-5 mb-3">
        <nav className="navbar navbar-expand-xl main-menu-bar px-3 px-lg-4 py-2 position-relative">
          {/* Nút Hamburger cho Mobile */}
          <button
            className="navbar-toggler header-toggler ms-auto"
            type="button"
            aria-controls="siteHeaderNav"
            aria-expanded={navExpanded}
            aria-label="Bật/tắt menu điều hướng"
            onClick={() => setNavExpanded((prev) => !prev)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className={`collapse navbar-collapse${navExpanded ? " show" : ""}`} id="siteHeaderNav">
            <ul className="navbar-nav header-menu-list align-items-xl-center me-auto mb-0">

              {/* MENU DANH MỤC (MEGA MENU) */}
              <li className="nav-item">
                <div
                  className="mega-menu-wrapper"
                  onMouseEnter={() => setShowMegaMenu(true)}
                  onMouseLeave={() => setShowMegaMenu(false)}
                >
                  <span className="nav-link menu-link d-inline-flex align-items-center menu-link-button">
                    <span className="menu-link-icon" aria-hidden="true">&#9776;</span>
                    DANH MỤC
                  </span>

                  {showMegaMenu && (
                    <div className="mega-menu-container">
                      <div className="mega-menu-grid">
                        {megaMenuData.map((group) => (
                          <div className="mega-menu-group" key={group.title}>
                            <div className="d-flex align-items-center mb-3">
                              {group.image && <img src={group.image} alt="" className="mega-menu-group-image" />}
                              <h6 className="fw-bold m-0 text-dark">{group.title}</h6>
                            </div>
                            <ul className="list-unstyled ps-2 mb-0 mega-menu-list">
                              {group.items.map((item) => (
                                <li key={`${group.title}-${item.name}`} className="mb-2">
                                  <Link
                                    to={item.link}
                                    className="text-decoration-none text-secondary mega-item-link"
                                    onClick={() => { setShowMegaMenu(false); setNavExpanded(false); }}
                                  >
                                    {item.name} {item.isSale && <span className="mega-item-sale">SALE</span>}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>

              {/* CÁC LIÊN KẾT TRANG CHÍNH */}
              <li className="nav-item"><NavLink to="/" end className="nav-link menu-link" onClick={() => setNavExpanded(false)}>TRANG CHỦ</NavLink></li>
              <li className="nav-item"><NavLink to="/about" className="nav-link menu-link" onClick={() => setNavExpanded(false)}>VỀ CHÚNG TÔI</NavLink></li>
              <li className="nav-item"><NavLink to="/san-pham" className="nav-link menu-link" onClick={() => setNavExpanded(false)}>BỘ SƯU TẬP</NavLink></li>

              {/* === LOGIC KIỂM TRA ĐĂNG NHẬP VÀ PHÂN QUYỀN === */}
              {cartData.isLoggedIn && cartData.currentUser ? (
                <li className="nav-item d-flex align-items-center gap-2 px-2">
                  {/* Hiển thị tên người dùng */}
                  <span className="nav-link menu-link" style={{ color: "#fff", fontWeight: "bold", paddingRight: "5px", cursor: "default" }}>
                    Chào, {cartData.currentUser.name}
                  </span>

                  {/* Nếu là Admin thì hiện thêm nút dẫn vào trang Quản trị */}
                  {cartData.currentUser.role === "admin" && (
                    <NavLink to="/admin/san-pham" className="nav-link menu-link" onClick={() => setNavExpanded(false)}>
                      ADMIN
                    </NavLink>
                  )}

                  {/* Nút Đăng xuất */}
                  <button
                    onClick={() => {
                      if (cartData.logout) cartData.logout();
                      setNavExpanded(false);
                    }}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "1px solid rgba(255,255,255,0.4)",
                      color: "#fff",
                      borderRadius: "20px",
                      padding: "4px 12px",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.3)"}
                    onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
                  >
                    Đăng xuất
                  </button>
                </li>
              ) : (
                // Nếu chưa đăng nhập, hiển thị nút Đăng nhập & Đăng ký
                <li className="nav-item">
                  <NavLink
                    to="/login"
                    className="nav-link menu-link"
                    onClick={(e) => {
                      e.preventDefault(); // Ngăn chặn chuyển trang của thẻ NavLink
                      openLogin();        // Mở Modal đăng nhập thay thế
                    }}
                  >
                    ĐĂNG NHẬP & ĐĂNG KÝ
                  </NavLink>
                </li>
              )}

              <li className="nav-item"><NavLink to="/lien-he" className="nav-link menu-link" onClick={() => setNavExpanded(false)}>LIÊN HỆ</NavLink></li>
            </ul>

            {/* HÀNH ĐỘNG: TÌM KIẾM VÀ GIỎ HÀNG */}
            <div className="header-actions d-flex flex-column flex-xl-row align-items-stretch align-items-xl-center gap-3 gap-xl-4 ms-xl-auto mt-3 mt-xl-0">
              {/* Ô tìm kiếm sản phẩm */}
              <div className="search-box">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Nhập từ khóa bạn cần tìm kiếm..."
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearchSubmit(searchValue);
                  }}
                />
                <button
                  type="button"
                  className="search-icon-btn"
                  onClick={() => onSearchSubmit(searchValue)}
                >
                  <img src="/IMG/search.png" alt="Search" className="header-action-image" />
                </button>
              </div>

              {/* Icon Giỏ hàng */}
              <div className="d-flex align-items-center justify-content-end gap-3 header-action-row">
                <Link
                  to="/gio-hang"
                  className="cart-icon"
                  aria-label="Giỏ hàng"
                  onClick={() => setNavExpanded(false)}
                >
                  <img src="/IMG/cart.png" alt="Cart" className="header-action-image" />

                  {/* Hiển thị số lượng sản phẩm trong giỏ hàng (Badge) */}
                  {totalItems > 0 && (
                    <span className="cart-badge">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* MODAL ĐĂNG NHẬP VÀ ĐĂNG KÝ (Ẩn/Hiện dựa trên State) */}
      <LoginModal show={showLoginModal} onClose={() => setShowLoginModal(false)} onLoginSuccess={handleLoginSuccess} onSwitchToRegister={openRegister} />
      <RegisterModal show={showRegisterModal} onClose={() => setShowRegisterModal(false)} onSwitchToLogin={openLogin} />
    </header>
  );
}
