import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="text-white py-5 w-100" style={{ backgroundColor: "#ff6b81", marginTop: 30 }}>
            <div className="container-fluid px-4 px-xl-5">
                <div className="row g-4">

                    {/* CỘT 1: THÔNG TIN CÔNG TY */}
                    <div className="col-md-3">
                        <h5 className="fw-bold mb-3">PINKYCLOUD OFFICE</h5>
                        <ul className="list-unstyled" style={{ fontSize: 14, lineHeight: 2 }}>
                            <li>📍 Số 57, đường Quang Trung, quận Gò Vấp, TP. HCM</li>
                            <li>
                                📞{" "}
                                <a href="tel:0909123456" className="text-white">
                                    0909 123 456
                                </a>
                            </li>
                            <li>
                                ✉️{" "}
                                <a href="mailto:pinkycloudvietnam@gmail.com" className="text-white">
                                    pinkycloudvietnam@gmail.com
                                </a>
                            </li>
                            <li>
                                🌐{" "}
                                <a href="https://www.pinkycloud.vn" className="text-white">
                                    www.pinkycloud.vn
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* CỘT 2: DANH MỤC */}
                    <div className="col-md-3">
                        <h5 className="fw-bold mb-3">DANH MỤC</h5>
                        <ul className="list-unstyled" style={{ fontSize: 14, lineHeight: 2 }}>
                            <li><a href="#" className="text-white text-decoration-none">Sức khỏe và làm đẹp</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Chăm sóc cơ thể</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Chăm sóc da mặt</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Chăm sóc tóc</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Clinic & Spa</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Trang điểm</a></li>
                        </ul>
                    </div>

                    {/* CỘT 3: CHÍNH SÁCH */}
                    <div className="col-md-3">
                        <h5 className="fw-bold mb-3">CHÍNH SÁCH HỖ TRỢ</h5>
                        <ul className="list-unstyled" style={{ fontSize: 14, lineHeight: 2 }}>
                            <li>
                                <Link to="/lien-he" className="text-white text-decoration-none">
                                    Hỗ trợ đặt hàng
                                </Link>
                            </li>
                            <li>
                                <Link to="/chinh-sach/chinh-sach-doi-tra" className="text-white text-decoration-none">
                                    Chính sách đổi trả
                                </Link>
                            </li>
                            <li>
                                <Link to="/chinh-sach/chinh-sach-van-chuyen" className="text-white text-decoration-none">
                                    Chính sách vận chuyển
                                </Link>
                            </li>
                            <li>
                                <Link to="/chinh-sach/chinh-sach-bao-mat" className="text-white text-decoration-none">
                                    Chính sách bảo mật
                                </Link>
                            </li>
                            <li>
                                <Link to="/chinh-sach/dieu-khoan-su-dung" className="text-white text-decoration-none">
                                    Điều khoản sử dụng
                                </Link>
                            </li>
                            <li>
                                <Link to="/chinh-sach/chinh-sach-du-lieu-ca-nhan" className="text-white text-decoration-none">
                                    Chính sách dữ liệu cá nhân
                                </Link>
                            </li>
                            <li>
                                <Link to="/chinh-sach/dieu-kien-giao-dich-chung" className="text-white text-decoration-none">
                                    Điều kiện giao dịch chung
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* CỘT 4: MẠNG XÃ HỘI */}
                    <div className="col-md-3">
                        <h5 className="fw-bold mb-3">THEO DÕI CHÚNG TÔI</h5>
                        <div className="d-flex flex-wrap" style={{ gap: 10, marginBottom: 16 }}>
                            <a href="https://facebook.com" target="_blank" rel="noreferrer">
                                <img src="/IMG/fbf.png" alt="Facebook" width="36" style={{ borderRadius: 8 }} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer">
                                <img src="/IMG/linkedin-54890.png" alt="Instagram" width="36" style={{ borderRadius: 8 }} />
                            </a>
                            <a href="https://tiktok.com" target="_blank" rel="noreferrer">
                                <img src="/IMG/tiktok-56510.png" alt="TikTok" width="36" style={{ borderRadius: 8 }} />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer">
                                <img src="/IMG/youtube-11341.png" alt="YouTube" width="36" style={{ borderRadius: 8 }} />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noreferrer">
                                <img src="/IMG/twitter.png" alt="Twitter" width="36" style={{ borderRadius: 8 }} />
                            </a>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <img src="/IMG/bocongthuong.png" alt="Bộ Công Thương" width="120" />
                        </div>

                        {/* Giờ làm việc */}
                        <div style={{ fontSize: 13, lineHeight: 1.8, opacity: 0.9 }}>
                            <div className="fw-bold mb-1">🕐 Giờ làm việc</div>
                            <div>Thứ 2 – Thứ 6: 8:00 – 21:00</div>
                            <div>Thứ 7 – CN: 9:00 – 20:00</div>
                        </div>
                    </div>
                </div>

                <hr className="border-white my-4" />

                {/* Hàng dưới: Copyright + link nhanh */}
                <div className="d-flex flex-wrap justify-content-between align-items-center" style={{ gap: 8, fontSize: 13 }}>
                    <p className="mb-0">
                        © 2024 PinkyCloud.vn — Sản phẩm chăm sóc da, Mỹ phẩm trang điểm, Mỹ phẩm chính hãng
                    </p>
                    <div className="d-flex flex-wrap" style={{ gap: 16 }}>
                        <Link to="/chinh-sach/dieu-khoan-su-dung" className="text-white text-decoration-none" style={{ opacity: 0.85 }}>
                            Điều khoản
                        </Link>
                        <Link to="/chinh-sach/chinh-sach-bao-mat" className="text-white text-decoration-none" style={{ opacity: 0.85 }}>
                            Bảo mật
                        </Link>
                        <Link to="/lien-he" className="text-white text-decoration-none" style={{ opacity: 0.85 }}>
                            Liên hệ
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}