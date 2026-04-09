import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "./CartConText";
import "../css/Header.css";
import megaMenuData from "../data/megaMenu";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";

export default function Header({ searchValue = "", onSearchChange = () => { } }) {
    const { cartItems, isLoggedIn, login, logout, currentUser } = useCart();
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    const [showMegaMenu, setShowMegaMenu] = useState(false);

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const handleLoginSuccess = (userInfo) => {
        login(userInfo);
        setShowLoginModal(false);
    };

    const openLogin = () => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
    };

    const openRegister = () => {
        setShowLoginModal(false);
        setShowRegisterModal(true);
    };

    const handleLogout = () => {
        logout();
        setShowUserDropdown(false);
    };

    return (
        <>
            <header className="site-header">
                {/* --- TOP HEADER --- */}
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

                {/* --- MENU BAR --- */}
                <div className="container-fluid px-4 px-xl-5 mb-3">
                    <div className="main-menu-bar d-flex align-items-center justify-content-between px-4 py-2 position-relative">

                        <ul className="nav d-none d-lg-flex gap-4 m-0 header-menu-list align-items-center flex-nowrap">

                            {/* 1. DANH MỤC + MEGA MENU */}
                            <li
                                className="mega-menu-wrapper"
                                onMouseEnter={() => setShowMegaMenu(true)}
                                onMouseLeave={() => setShowMegaMenu(false)}
                                style={{ position: 'static' }}
                            >
                                <span className="menu-link d-flex align-items-center" style={{ cursor: "pointer", fontWeight: "bold" }}>
                                    <span style={{ fontSize: "1.2rem", marginRight: "6px" }}>☰</span> DANH MỤC
                                </span>

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

                            {/* 2. CÁC LINK MENU */}
                            <li><NavLink to="/" className="menu-link" end>TRANG CHỦ</NavLink></li>
                            <li><a href="#" className="menu-link">VỀ CHÚNG TÔI</a></li>
                            <li><NavLink to="/bo-suu-tap" className="menu-link">BỘ SƯU TẬP</NavLink></li>

                            {/* 3. ĐĂNG NHẬP & ĐĂNG KÝ — thay bằng logic thật */}
                            <li style={{ position: "relative" }}>
                                {isLoggedIn ? (
                                    // --- Khi đã đăng nhập: hiện tên + dropdown ---
                                    <div
                                        style={{ position: "relative" }}
                                        onMouseEnter={() => setShowUserDropdown(true)}
                                        onMouseLeave={() => setShowUserDropdown(false)}
                                    >
                                        <span className="menu-link d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                                            {/* Avatar chữ cái đầu */}
                                            <span style={{
                                                width: 28, height: 28, borderRadius: "50%",
                                                background: "#f76c85", color: "#fff",
                                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 13, fontWeight: 700, flexShrink: 0,
                                            }}>
                                                {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
                                            </span>
                                            <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {currentUser?.name || "Tài khoản"}
                                            </span>
                                            <span style={{ fontSize: 10 }}>▼</span>
                                        </span>

                                        {/* Dropdown menu */}
                                        {showUserDropdown && (
                                            <div style={{
                                                position: "absolute", top: "100%", left: 0,
                                                background: "#fff", borderRadius: 8, minWidth: 180,
                                                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                                                zIndex: 999, overflow: "hidden", marginTop: 4,
                                            }}>
                                                {/* Thông tin user */}
                                                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{currentUser?.name}</div>
                                                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{currentUser?.email}</div>
                                                </div>

                                                {/* Các mục dropdown */}
                                                {[
                                                    { icon: "👤", label: "Tài khoản của tôi", to: "/account" },
                                                    { icon: "📦", label: "Đơn hàng của tôi", to: "/account/orders" },
                                                    { icon: "❤️", label: "Sản phẩm yêu thích", to: "/account/wishlist" },
                                                ].map((item, i) => (
                                                    <Link key={i} to={item.to} style={{
                                                        display: "flex", alignItems: "center", gap: 10,
                                                        padding: "10px 16px", textDecoration: "none",
                                                        color: "#333", fontSize: 14,
                                                        borderBottom: "1px solid #f5f5f5",
                                                        transition: "background 0.15s",
                                                    }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "#fff5f7"}
                                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                    >
                                                        <span>{item.icon}</span> {item.label}
                                                    </Link>
                                                ))}

                                                {/* Nút đăng xuất */}
                                                <button onClick={handleLogout} style={{
                                                    width: "100%", padding: "10px 16px",
                                                    background: "none", border: "none",
                                                    textAlign: "left", cursor: "pointer",
                                                    color: "#f76c85", fontSize: 14,
                                                    display: "flex", alignItems: "center", gap: 10,
                                                    transition: "background 0.15s",
                                                }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "#fff5f7"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                >
                                                    <span>🚪</span> Đăng xuất
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // --- Khi chưa đăng nhập: hiện 2 nút ---
                                    <div className="d-flex align-items-center gap-2">
                                        <span
                                            className="menu-link"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setShowLoginModal(true)}
                                        >
                                            ĐĂNG NHẬP
                                        </span>
                                        <span style={{ color: "#ccc" }}>|</span>
                                        <span
                                            className="menu-link"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setShowRegisterModal(true)}
                                        >
                                            ĐĂNG KÝ
                                        </span>
                                    </div>
                                )}
                            </li>

                            <NavLink to="/lien-he" className="menu-link">LIÊN HỆ</NavLink>
                        </ul>

                        {/* --- SEARCH & CART --- */}
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
                                        position: "absolute", top: -8, right: -12,
                                        background: "white", color: "#ff6b81",
                                        borderRadius: "50%", padding: "2px 6px",
                                        fontSize: "12px", fontWeight: "bold", lineHeight: 1,
                                    }}>
                                        {totalItems}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- MODALS (đặt ngoài <header> để không bị clip) --- */}
            <LoginModal
                show={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={openRegister}
            />
            <RegisterModal
                show={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                onSwitchToLogin={openLogin}
            />
        </>
    );
}