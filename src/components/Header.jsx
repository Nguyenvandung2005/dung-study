import React from "react";
import { Link, NavLink } from "react-router-dom";
import "../css/Header.css";

export default function Header({ searchValue = "", onSearchChange = () => {} }) {
  return (
    <header className="site-header">
      <div className="container d-flex justify-content-between align-items-center py-3 header-top">
        <div className="logo">
          <Link to="/" className="logo-link">
            <img src="/IMG/logo.jpg" alt="PinkyCloud" className="header-logo" />
          </Link>
        </div>

        <div className="header-center-brand">
          <div className="header-brand-tag">
            MỸ PHẨM CHÍNH HÃNG • CHĂM SÓC DA CAO CẤP
          </div>
          <div className="header-brand-subtitle">
            Nâng tầm trải nghiệm làm đẹp mỗi ngày
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 header-social-wrap">
          <span className="social-text">Theo dõi chúng tôi</span>

          <div className="d-flex gap-2 social-list">
            <a href="#" className="social-link">
              <img src="/IMG/fb.png" alt="FB" className="social-icon" />
            </a>
            <a href="#" className="social-link">
              <img src="/IMG/ins.png" alt="INS" className="social-icon" />
            </a>
            <a href="#" className="social-link">
              <img src="/IMG/tt.png" alt="TT" className="social-icon" />
            </a>
            <a href="#" className="social-link">
              <img src="/IMG/ytb.png" alt="YT" className="social-icon" />
            </a>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="main-menu-bar d-flex align-items-center justify-content-between px-4 py-2">
          <ul className="nav d-none d-lg-flex gap-4 m-0 header-menu-list">
            <li>
              <NavLink to="/" end className="menu-link">
                TRANG CHỦ
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className="menu-link">
                VỀ CHÚNG TÔI
              </NavLink>
            </li>
            <li>
              <NavLink to="/san-pham" className="menu-link">
                BỘ SƯU TẬP
              </NavLink>
            </li>
            <li>
              <NavLink to="/login" className="menu-link">
                ĐĂNG NHẬP & ĐĂNG KÝ
              </NavLink>
            </li>
            <li>
              <a href="/#office" className="menu-link">
                LIÊN HỆ
              </a>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-4 header-actions">
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="Nhập từ khóa bạn cần tìm kiếm..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              <button type="button" className="search-icon-btn">
                🔍
              </button>
            </div>

            <a href="#" className="cart-icon">🛒</a>
          </div>
        </div>
      </div>
    </header>
  );
}
