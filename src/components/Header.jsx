
import React from "react";
import { Link } from "react-router-dom";

export default function Header({ searchValue = "", onSearchChange = () => { } }) {
    return (
        <header style={{ backgroundColor: "#fff", paddingBottom: "20px" }}>

            <div className="container d-flex justify-content-between align-items-center py-3">
                <div className="logo">
                    <Link to="/">
                        <img src="/IMG/logo.jpg" alt="PinkyCloud" className="header-logo" />
                    </Link>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <span className="social-text">Theo dõi chúng tôi</span>

                    <div className="d-flex gap-2">
                        <a href="#"><img src="/IMG/fb.png" alt="FB" className="social-icon" /></a>
                        <a href="#"><img src="/IMG/ins.png" alt="INS" className="social-icon" /></a>
                        <a href="#"><img src="/IMG/tt.png" alt="TT" className="social-icon" /></a>
                        <a href="#"><img src="/IMG/ytb.png" alt="YT" className="social-icon" /></a>
                    </div>
                </div>
            </div>

            {/* --- HÀNG DƯỚI: MENU MÀU HỒNG --- */}
            <div className="container">
                <div className="main-menu-bar d-flex align-items-center justify-content-between px-4 py-2">

                    {/* Menu Links */}
                    <ul className="nav d-none d-lg-flex gap-4 m-0">
                        <li><Link to="/" className="menu-link">TRANG CHỦ</Link></li>
                        <li><Link to="/about" className="menu-link">VỀ CHÚNG TÔI</Link></li>
                        <li><a href="#" className="menu-link">BỘ SƯU TẬP</a></li>
                        <li><Link to="/login" className="menu-link">ĐĂNG NHẬP & ĐĂNG KÝ</Link></li>
                        <li><a href="#" className="menu-link">LIÊN HỆ</a></li>
                    </ul>

                    {/* Search & Cart */}
                    <div className="d-flex align-items-center gap-4">
                        {/* Search Box */}
                        <div className="search-box">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Nhập từ khóa bạn cần tìm kiếm . . ."
                                value={searchValue}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                            <button className="search-icon-btn">🔍</button>
                        </div>

                        {/* Cart */}
                        <a href="#" className="cart-icon">🛒</a>
                    </div>

                </div>
            </div>
        </header>
    );
}