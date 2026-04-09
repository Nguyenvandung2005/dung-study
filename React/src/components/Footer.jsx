
import React from "react";

export default function Footer() {
    return (
        <footer className="text-white py-4 w-100" style={{ backgroundColor: "#f76c85", marginTop: 30 }}>
            <div className="container-fluid text-center">
                <div className="row">
                    <div className="col-md-3">
                        <h5 className="fw-bold">PINKYCLOUD OFFICE</h5>
                        <p>Địa chỉ: Số 57, đường Quang Trung, quận Gò Vấp, TP. HCM</p>
                        <p>
                            Mail:{" "}
                            <a href="mailto:pinkycloudvietnam@gmail.com" className="text-white">
                                pinkycloudvietnam@gmail.com
                            </a>
                        </p>
                        <p>
                            Website:{" "}
                            <a href="#" className="text-white">
                                www.pinkycloud.vn
                            </a>
                        </p>
                    </div>

                    <div className="col-md-3">
                        <h5 className="fw-bold">DANH MỤC</h5>
                        <ul className="list-unstyled">
                            <li><a href="#" className="text-white text-decoration-none">Sức khỏe và làm đẹp</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Chăm sóc cơ thể</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Chăm sóc da mặt</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Chăm sóc tóc</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Clinic & Spa</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Trang điểm</a></li>
                        </ul>
                    </div>

                    <div className="col-md-3">
                        <h5 className="fw-bold">CHÍNH SÁCH HỖ TRỢ</h5>
                        <ul className="list-unstyled">
                            <li><a href="#" className="text-white text-decoration-none">Hỗ trợ đặt hàng</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Chính sách trả hàng</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Chính sách bảo hành</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Chính sách người dùng</a></li>
                            <li><a href="#" className="text-white text-decoration-none">Chính sách mua hàng</a></li>
                        </ul>
                    </div>

                    <div className="col-md-3">
                        <h5 className="fw-bold">THEO DÕI CHÚNG TÔI</h5>
                        <div className="d-flex info" style={{ gap: 10, justifyContent: "center" }}>
                            <a href="https://facebook.com" className="me-1">
                                <img src="/IMG/fbf.png" alt="Facebook" width="32" />
                            </a>
                            <a href="https://instagram.com" className="me-1">
                                <img src="/IMG/linkedin-54890.png" alt="Instagram" width="32" />
                            </a>
                            <a href="https://tiktok.com" className="me-1">
                                <img src="/IMG/tiktok-56510.png" alt="TikTok" width="32" />
                            </a>
                            <a href="https://youtube.com" className="me-1">
                                <img src="/IMG/youtube-11341.png" alt="YouTube" width="32" />
                            </a>
                            <a href="https://twitter.com" className="me-1">
                                <img src="/IMG/twitter.png" alt="Twitter" width="32" />
                            </a>
                        </div>

                        <div className="mt-2">
                            <img src="/IMG/bocongthuong.png" alt="Bộ Công Thương" width="120" />
                        </div>
                    </div>
                </div>

                <hr className="border-white my-3" />

                <div className="text-center">
                    <p className="mb-0">
                        2023 Copyright PinkyCloud.vn - Sản phẩm chăm sóc da, Mỹ phẩm trang điểm, Mỹ phẩm chính hãng
                    </p>
                </div>
            </div>
        </footer>
    );
}
