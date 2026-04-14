import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/HomePage.css";
import ProductCard from "../components/ProductCard";
import useProductsData from "../hooks/useProductsData";
import brandUrls from "../data/brandUrls.json";
import officeLocations from "../data/officeLocations.json";
import hotVouchers from "../data/hotVouchers.json";
import newsItems from "../data/newsItems.json";


// Lấy liên kết ngoài của thương hiệu. Nếu không có trong file json, sẽ tạo link tìm kiếm Google.
const getBrandUrl = (brand) => {
  return brandUrls[brand] || `https://www.google.com/search?q=${encodeURIComponent(brand)}`;
};

// Thuật toán trộn mảng ngẫu nhiên (Fisher-Yates) để làm mới danh sách sản phẩm mỗi khi tải lại trang.
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Chuyển đổi chuỗi ngày tháng VN (dd/mm/yyyy) sang dạng số để so sánh/sắp xếp.
const parseVietnameseDate = (dateString) => {
  const [day, month, year] = dateString.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
};

// Định dạng số thành tiền tệ VND (ví dụ: 100.000 đ).
const formatVnd = (value) => `${value.toLocaleString("vi-VN")} đ`;

// Tính giá gốc dựa trên giá bán hiện tại và % giảm giá.
const getOriginalPrice = (price, discount = 0) => {
  if (!discount || discount <= 0) return null;
  return Math.round(price / (1 - discount / 100));
};

// Đảm bảo các con số luôn có 2 chữ số (ví dụ: 09 thay vì 9).
const formatTimePart = (value) => String(value).padStart(2, "0");

const bannerImages = [
  "/IMG/banner01.png", "/IMG/banner02.png", "/IMG/banner03.png",
  "/IMG/banner04.png", "/IMG/banner05.png", "/IMG/banner06.png"
];

// Tạo mảng ảnh lặp: Thêm ảnh đầu tiên vào cuối mảng để tạo hiệu ứng trượt vô tận.
const loopImages = [...bannerImages, bannerImages[0]];

/**
 * COMPONENT: HeroBanner
 * Quản lý Slider ảnh, thông báo Voucher và các thống kê tổng quan.
 */
function HeroBanner({ totalProducts, productCategoryCount }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [showVouchers, setShowVouchers] = useState(false);

  // Tự động chuyển slide sau mỗi 4.2 giây.
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => prev + 1);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  // Xử lý hiệu ứng trượt vô tận (Infinite Loop)
  const handleTransitionEnd = () => {
    // Nếu đang ở slide cuối (bản sao của slide 0), nhảy lập tức về slide 0 thật.
    if (activeSlide >= bannerImages.length) {
      setIsTransitioning(false); // Tắt hiệu ứng trượt để nhảy ngầm
      setActiveSlide(0);
    }
  };

  // Bật lại hiệu ứng trượt sau khi đã nhảy về slide đầu.
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsTransitioning(true));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  return (
    <section className="hero-banner rounded-4 position-relative overflow-hidden">
      {/* Nút Hotdeal và Popup Voucher */}
      <div className="hero-hotdeal position-absolute top-0 end-0 mt-3 me-3">
        <button onClick={() => setShowVouchers((prev) => !prev)} className="btn btn-sm btn-outline-danger hero-hotdeal-btn">
          Hotdeal
        </button>
        {showVouchers && (
          <div className="hero-voucher-popup mt-2 rounded-4 shadow-lg">
            <div className="hero-voucher-grid">
              {hotVouchers.map((voucher) => (
                <div key={voucher.id} className="hero-voucher-card rounded-4" style={{ background: voucher.accent }}>
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div>
                      <div className="hero-voucher-label">VOUCHER HOT</div>
                      <h3 className="hero-voucher-title">{voucher.title}</h3>
                      <div className="hero-voucher-detail">{voucher.detail}</div>
                    </div>
                    <div className="hero-voucher-code rounded-4">{voucher.code}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cấu trúc Slider */}
      <div className="hero-slider-wrapper position-absolute top-0 end-0 h-100">
        <div className="hero-slider-mask position-absolute top-0 start-0 w-100 h-100">
          <div
            onTransitionEnd={handleTransitionEnd}
            className="hero-slider-track"
            style={{
              width: `${loopImages.length * 100}%`,
              transform: `translateX(-${activeSlide * (100 / loopImages.length)}%)`,
              transition: isTransitioning ? "transform 1400ms cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          >
            {loopImages.map((image, index) => (
              <div key={`${image}-${index}`} className="hero-slide" style={{ width: `${100 / loopImages.length}%` }}>
                <img src={image} alt={`Banner ${index}`} className="hero-slide-image" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nội dung chữ đè lên Banner */}
      <div className="row align-items-center position-relative hero-content-row">
        <div className="col-12 col-xl-7">
          <div className="hero-badge d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill">
            PinkyCloud Office
          </div>
          <h1 className="hero-title text-white">Chăm sóc sắc đẹp,<br />nâng tầm trải nghiệm</h1>
          <p className="hero-description text-white">
            Hiện có <strong>{totalProducts}</strong> sản phẩm trong <strong>{productCategoryCount}</strong> danh mục.
          </p>
          <div className="d-flex flex-wrap gap-3 mb-4">
            <a href="#featured-multi-brands" className="btn btn-light btn-lg hero-primary-btn">Khám phá sản phẩm</a>
            <a href="#news" className="btn btn-outline-light btn-lg hero-secondary-btn">Xem tin mới</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * COMPONENT CHÍNH: HomePage
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { products } = useProductsData(); // Lấy dữ liệu sản phẩm từ bộ nhớ local/server

  // Thời gian còn lại của Flash Deal (giả lập 1h 32ph 54s)
  const [flashDealsSecondsLeft, setFlashDealsSecondsLeft] = useState(1 * 3600 + 32 * 60 + 54);

  // Thống kê dữ liệu sản phẩm
  const productCategoryCount = useMemo(() => new Set(products.map(p => p.category)).size, [products]);
  const totalProducts = products.length;

  // Lọc 8 sản phẩm ngẫu nhiên để giới thiệu
  const featuredProducts = useMemo(() => shuffleArray(products).slice(0, 8), [products]);
  const featuredShowcase = useMemo(() => featuredProducts.slice(0, 4), [featuredProducts]);

  // Lọc các sản phẩm có giảm giá mạnh nhất cho khu vực Flash Deals
  const hotPromotionProducts = useMemo(() => {
    return [...products]
      .filter((p) => (p.discount || 0) > 0)
      .sort((a, b) => (b.discount || 0) - (a.discount || 0))
      .slice(0, 6);
  }, [products]);

  // Logic chạy đồng hồ đếm ngược Flash Deal
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashDealsSecondsLeft((prev) => prev <= 1 ? 1 * 3600 + 32 * 60 + 54 : prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = Math.floor(flashDealsSecondsLeft / 3600);
  const m = Math.floor((flashDealsSecondsLeft % 3600) / 60);
  const s = flashDealsSecondsLeft % 60;

  // Sắp xếp tin tức theo ngày mới nhất
  const latestNews = useMemo(() => {
    return [...newsItems]
      .sort((a, b) => parseVietnameseDate(b.date) - parseVietnameseDate(a.date))
      .slice(0, 3);
  }, []);

  return (
    <div className="container-fluid homepage-container">
      {/* 1. Phần Banner đầu trang */}
      <HeroBanner totalProducts={totalProducts} productCategoryCount={productCategoryCount} />

      {/* 2. Phần Sản phẩm nổi bật (Showcase) */}
      <section id="featured-multi-brands" className="mt-5">
        <h2 className="section-title">Sản phẩm nổi bật từ nhiều nhãn hàng</h2>
        <div className="featured-showcase-grid mt-3">
          {featuredShowcase.map((product, index) => (
            <a key={product.id} href={getBrandUrl(product.brand)} target="_blank" rel="noreferrer" className={`featured-showcase-card featured-showcase-card-${index + 1}`}>
              <div className="featured-showcase-image-wrap">
                {product.discount > 0 && <div className="featured-showcase-discount-badge">-{product.discount}%</div>}
                <img src={product.image} alt={product.name} className="featured-showcase-image" />
              </div>
              <div className="featured-showcase-content">
                <div className="featured-showcase-brand">{product.brand}</div>
                <h3 className="featured-showcase-title">{product.name}</h3>
                <div className="featured-showcase-price-wrap">
                  <span className="featured-showcase-sale-price">{formatVnd(product.price)}</span>
                  {product.discount > 0 && (
                    <span className="featured-showcase-old-price">{formatVnd(getOriginalPrice(product.price, product.discount))}</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 3. Phần Flash Deals (Khuyến mãi giới hạn thời gian) */}
      <section id="hot-promotions" className="mt-5">
        <div className="flash-deals-head d-flex align-items-center justify-content-between">
          <div className="flash-deals-title-wrap d-flex align-items-center gap-3">
            <h2 className="flash-deals-title m-0">Flash Deals</h2>
            <div className="flash-deals-timer">
              <span className="flash-time-chip">{formatTimePart(h)}</span> :
              <span className="flash-time-chip">{formatTimePart(m)}</span> :
              <span className="flash-time-chip">{formatTimePart(s)}</span>
            </div>
          </div>
          <button className="flash-deals-viewall btn" onClick={() => navigate("/san-pham")}>Xem tất cả</button>
        </div>

        <div className="row g-3 mt-1">
          {hotPromotionProducts.map((product, index) => {
            // Giả lập phần trăm đã bán ngẫu nhiên để tăng tính kích cầu
            const soldPercent = Math.min(92, Math.max(25, (product.discount || 0) * 2 + 18 + index * 4));
            return (
              <div key={product.id} className="col-12 col-sm-6 col-lg-4 col-xl-2">
                <div className="flash-deal-item-shell">
                  <ProductCard product={product} />
                  <div className="flash-deal-progress"><span style={{ width: `${soldPercent}%` }} /></div>
                  <div className="flash-deal-progress-text text-center">Đã bán {soldPercent}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Phần Danh sách Văn phòng (Thông tin liên hệ) */}
      <section id="office" className="mt-5">
        <h2 className="section-title">Hệ thống văn phòng PinkyCloud</h2>
        <div className="row g-4 mt-3">
          {officeLocations.map((office) => (
            <div key={office.title} className="col-12 col-md-4">
              <div className="card h-100 office-card border-0 shadow-sm">
                <div className="card-body">
                  <h3 className="card-title office-title">{office.title}</h3>
                  <p className="office-description text-muted">{office.description}</p>
                  <div className="small"><b>Email:</b> {office.contact}</div>
                  <div className="small"><b>Hotline:</b> {office.phone}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Phần Tin tức nổi bật */}
      <section id="news" className="mt-5 mb-5">
        <h2 className="section-title">Tin tức sắc đẹp</h2>
        <div className="row g-4 mt-3">
          {latestNews.map((news) => (
            <div key={news.id} className="col-12 col-md-6 col-xl-4">
              <div className="card h-100 news-card border-0 shadow-sm">
                <div className="news-card-body p-4">
                  <div className="news-date text-pink mb-2">{news.date}</div>
                  <h3 className="news-title h5 fw-bold">{news.title}</h3>
                  <p className="news-excerpt text-muted small">{news.excerpt}</p>
                  <button className="btn btn-pink btn-sm" onClick={() => navigate(`/tin-tuc/${news.slug}`)}>Xem chi tiết</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}