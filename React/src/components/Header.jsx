import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "./CartConText"; // Đảm bảo đúng file của bạn
import "../css/Header.css";
import megaMenuData from "../data/megaMenu";

export default function Header({ searchValue = "", onSearchChange = () => { } }) {
    const { cartItems } = useCart();
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    const [showMegaMenu, setShowMegaMenu] = useState(false);

    return (
        <header className="site-header">
            {/* --- TOP HEADER (Đổi thành container-fluid) --- */}
            <div className="container-fluid px-4 px-xl-5 d-flex justify-content-between align-items-center py-3 header-top">
                <div className="logo">
                    <Link to="/" className="logo-link">
                        <img src="/IMG/logo.jpg" alt="PinkyCloud" className="header-logo" />
                    </Link>
                </div>

                <div className="header-center-brand">
                    <div className="header-brand-tag">MỸ PHẨM CHÍNH HÃNG • CHĂM SÓC DA CAO CẤP</div>
                    <div className="header-brand-subtitle">Nâng tầm trải nghiệm làm đẹp mỗi ngày</div>
                </div>

                <div className="d-flex align-items-center gap-3 header-social-wrap">
                    <span className="social-text">Theo dõi chúng tôi</span>
                    <div className="d-flex gap-2 social-list">
                        <a href="#" className="social-link"><img src="/IMG/fb.png" alt="FB" className="social-icon" /></a>
                        <a href="#" className="social-link"><img src="/IMG/ins.png" alt="INS" className="social-icon" /></a>
                        <a href="#" className="social-link"><img src="/IMG/tt.png" alt="TT" className="social-icon" /></a>
                        <a href="#" className="social-link"><img src="/IMG/ytb.png" alt="YT" className="social-icon" /></a>
                    </div>
                </div>
            </div>

            {/* --- MENU BAR (Đổi thành container-fluid) --- */}
            <div className="container-fluid px-4 px-xl-5 mb-3">
                <div className="main-menu-bar d-flex align-items-center justify-content-between px-4 py-2 position-relative">

                    <ul className="nav d-none d-lg-flex gap-4 m-0 header-menu-list align-items-center flex-nowrap">
                        {/* 1. MỤC DANH MỤC */}
                        <li
                            className="mega-menu-wrapper"
                            onMouseEnter={() => setShowMegaMenu(true)}
                            onMouseLeave={() => setShowMegaMenu(false)}
                            style={{ position: 'static' }}
                        >
                            <span className="menu-link d-flex align-items-center" style={{ cursor: "pointer", fontWeight: "bold" }}>
                                <span style={{ fontSize: "1.2rem", marginRight: "6px" }}>☰</span> DANH MỤC
                            </span>

                            {/* MEGA MENU */}
                            {showMegaMenu && (
                                <div className="mega-menu-container">
                                    <div className="row p-4 m-0 w-100">
                                        {megaMenuData.map((group, index) => (
                                            <div className="col-md-3 mb-4" key={index}>
                                                <div className="d-flex align-items-center mb-3">
                                                    {group.image && <img src={group.image} alt="" style={{ width: 30, height: 30, marginRight: 10, objectFit: 'contain' }} />}
                                                    <h6 className="fw-bold m-0 text-dark">{group.title}</h6>
                                                </div>
                                                <ul className="list-unstyled ps-2">
                                                    {group.items.map((item, idx) => (
                                                        <li key={idx} className="mb-2">
                                                            <Link to={item.link} className="text-decoration-none text-secondary mega-item-link" onClick={() => setShowMegaMenu(false)}>
                                                                {item.name}
                                                                {item.isSale && <span className="ms-2 px-1 rounded text-white" style={{ backgroundColor: "#ff6b81", fontSize: "10px", fontWeight: "bold" }}>SALE</span>}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </li>

                        {/* 2. CÁC LINK MENU KHÁC */}
                        <li><NavLink to="/" className="menu-link" end>TRANG CHỦ</NavLink></li>
                        <li><a href="#" className="menu-link">VỀ CHÚNG TÔI</a></li>
                        <li><NavLink to="/bo-suu-tap" className="menu-link">BỘ SƯU TẬP</NavLink></li>
                        <li><a href="#" className="menu-link">ĐĂNG NHẬP & ĐĂNG KÝ</a></li>
                        <li><a href="#" className="menu-link">LIÊN HỆ</a></li>
                    </ul>

                    {/* --- ACTIONS (SEARCH & CART) --- */}
                    <div className="d-flex align-items-center gap-4 header-actions ms-auto">
                        <div className="search-box">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Nhập từ khóa bạn cần tìm kiếm..."
                                value={searchValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                            <button className="search-icon-btn">
                                <img src="/IMG/search.png" alt="Search" style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>

                        <Link to="/cart" className="cart-icon" style={{ position: "relative", textDecoration: "none", display: "flex", alignItems: "center" }}>
                            <img src="/IMG/cart.png" alt="Cart" style={{ width: '20px', height: '20px' }} />
                            {totalItems > 0 && (
                                <span style={{
                                    position: "absolute", top: -8, right: -12, background: "white", color: "#ff6b81",
                                    borderRadius: "50%", padding: "2px 6px", fontSize: "12px", fontWeight: "bold", lineHeight: 1
                                }}>
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}