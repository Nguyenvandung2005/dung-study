import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/HomePage.css";
import ProductCard from "../components/ProductCard";
import useFetch from "../hooks/useFetch";
import useProductsData from "../hooks/useProductsData";

function getBrandUrl(brand, brandUrls) {
  return brandUrls[brand] || `https://www.google.com/search?q=${encodeURIComponent(brand)}`;
}


function shuffleArray(array) { //Hàm để xáo trộn mảng product ngẫu nhiên
  const newArray = [...array]; 
  for (let i = newArray.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function parseVietnameseDate(dateString) {//Hàm để chuyển đổi chuỗi thời gian về dạng timestamp để có thể thực hiện sắp xếp
  const [day, month, year] = dateString.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function formatVnd(value) { //Hàm để định dạng kiểu hiển thị tiền tệ Việt Nam
  return `${value.toLocaleString("vi-VN")} đ`;
}

function getOriginalPrice(price, discount = 0) {//Hàm để tính giá gốc của product dựa vào giá hiện tại (giá đã được discount)
  if (!discount || discount <= 0) return null;
  return Math.round(price / (1 - discount / 100));
}
function formatTimePart(value) {//Hàm để định dạng thời gian đếm ngược
  return String(value).padStart(2, "0");
}

const bannerImages = [//Khai báo một mảng các đường dẫn ảnh banner
  "/IMG/banner01.png",
  "/IMG/banner02.png",
  "/IMG/banner03.png",
  "/IMG/banner04.png",
  "/IMG/banner05.png",
  "/IMG/banner06.png"
];

const loopImages = [...bannerImages, bannerImages[0]];

function HeroBanner({ totalProducts, productCategoryCount, hotVouchers }) {//Component để hiển thị banner
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  //Khai báo useState để quản lý trạng thái chuyển đổi của các slide, mặc định ban đầu là true
  const [showVouchers, setShowVouchers] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        if (prev >= bannerImages.length) {
          return bannerImages.length; 
        }
        return prev + 1;
      });
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  const handleTransitionEnd = () => {//Hàm để xử lý khi kết thúc quá trình chuyển đổi slide
    if (activeSlide >= bannerImages.length) {
      setIsTransitioning(false);
      setActiveSlide(0);
    }
  };
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });

      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  return (
    <section className="hero-banner rounded-4 position-relative overflow-hidden">
      <div className="hero-hotdeal position-absolute top-0 end-0 mt-3 me-3">
        <button
          onClick={() => setShowVouchers((prev) => !prev)}
          className="btn btn-sm btn-outline-danger hero-hotdeal-btn"
        >
          Hotdeal
        </button>

        {showVouchers && (
          <div className="hero-voucher-popup rounded-4">
            <div className="hero-voucher-grid">
              {hotVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="hero-voucher-card rounded-4"
                  style={{ background: voucher.accent }}
                >
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div>
                      <div className="hero-voucher-label">VOUCHER HOT</div>
                      <h3 className="hero-voucher-title">{voucher.title}</h3>
                      <div className="hero-voucher-detail">{voucher.detail}</div>
                    </div>
                    <div className="hero-voucher-code rounded-4">
                      {voucher.code}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hero-radial-overlay position-absolute top-0 start-0 w-100 h-100" />

      <div className="hero-slider-wrapper position-absolute top-0 end-0 h-100">
        <div className="hero-slider-mask position-absolute top-0 start-0 w-100 h-100">
          <div
            onTransitionEnd={handleTransitionEnd}
            className="hero-slider-track"
            style={{
              width: `${loopImages.length * 100}%`,
              transform: `translateX(-${activeSlide * (100 / loopImages.length)}%)`,
              transition: isTransitioning
                ? "transform 1400ms cubic-bezier(0.4, 0, 0.2, 1)"
                : "none",
            }}
          >
            {loopImages.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="hero-slide"
                style={{ width: `${100 / loopImages.length}%` }}
              >
                <img
                  src={image}
                  alt={`Banner ${index + 1}`}
                  className="hero-slide-image"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="hero-overlay-left position-absolute top-0 start-0 h-100" />
        <div className="hero-overlay-right position-absolute top-0 end-0 h-100" />
        <div className="hero-overlay-bottom position-absolute start-0 bottom-0" />
      </div>

      <div className="row align-items-center position-relative hero-content-row">
        <div className="col-12 col-xl-7">
          <div className="hero-badge d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill">
            PinkyCloud Office
          </div>

          <h1 className="hero-title text-white">
            Chăm sóc sắc đẹp,
            <br />
            nâng tầm trải nghiệm
          </h1>

          <p className="hero-description text-white">
            Hiện có <strong>{totalProducts}</strong> sản phẩm chất lượng trong{" "}
            <strong>{productCategoryCount}</strong> danh mục. Khám phá dịch vụ và
            tin tức mới nhất từ hệ thống PinkyCloud.
          </p>

          <div className="d-flex flex-wrap gap-3 mb-4">
            <a
              href="#featured-multi-brands"
              className="btn btn-light btn-lg hero-primary-btn"
            >
              Khám phá sản phẩm
            </a>
            <a
              href="#news"
              className="btn btn-outline-light btn-lg hero-secondary-btn"
            >
              Xem tin mới
            </a>
          </div>
        </div>

        <div className="col-12 col-xl-5 mt-4 mt-xl-0">
          <div className="ms-xl-auto rounded-4 position-relative" />
        </div>
      </div>
    </section>
  );
}

export default function HomePage({ query = "" }) {
  const navigate = useNavigate();
  const { products } = useProductsData();
  const { data: brandUrlsData } = useFetch("/api/brand-urls");
  const { data: officeLocationsData } = useFetch("/api/office-locations");
  const { data: hotVouchersData } = useFetch("/api/hot-vouchers");
  const { data: newsItemsData } = useFetch("/api/news-items");
  const [flashDealsSecondsLeft, setFlashDealsSecondsLeft] = useState(
    1 * 3600 + 32 * 60 + 54
  );
  const brandUrls = brandUrlsData && typeof brandUrlsData === "object" ? brandUrlsData : {};
  const officeLocations = Array.isArray(officeLocationsData) ? officeLocationsData : [];
  const hotVouchers = Array.isArray(hotVouchersData) ? hotVouchersData : [];
  const newsItems = Array.isArray(newsItemsData) ? newsItemsData : [];
  const productCategoryCount = new Set(products.map((p) => p.category)).size;
  const totalProducts = products.length;

  useEffect(() => {
    const fontId = "playfair-display-font";

    if (!document.getElementById(fontId)) {
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const featuredShowcaseProducts = useMemo(() => {
    return shuffleArray(products).slice(0, 4);
  }, [products]);

  const hotPromotionProducts = useMemo(() => {
    return [...products]
      .filter((product) => (product.discount || 0) > 0)
      .sort((a, b) => (b.discount || 0) - (a.discount || 0))
      .slice(0, 6);
  }, [products]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlashDealsSecondsLeft((prev) =>
        prev <= 1 ? 1 * 3600 + 32 * 60 + 54 : prev - 1
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const flashDealHours = Math.floor(flashDealsSecondsLeft / 3600);
  const flashDealMinutes = Math.floor((flashDealsSecondsLeft % 3600) / 60);
  const flashDealSeconds = flashDealsSecondsLeft % 60;
  const normalizedNewsQuery = query.trim().toLowerCase();//Lưu trữ chuẩn hóa từ khóa tìm kiếm
  const latestNewsItems = useMemo(() => {
    const filteredNews = [...newsItems].filter((item) => {
      if (!normalizedNewsQuery) return true;
      const searchableContent = [
        item.title,
        item.excerpt,
        item.content,
        item.category,
      ]
        .join(" ")
        .toLowerCase();

      return searchableContent.includes(normalizedNewsQuery);
    });

    return filteredNews
      .sort((a, b) => parseVietnameseDate(b.date) - parseVietnameseDate(a.date))
      .slice(0, 3);
  }, [normalizedNewsQuery, newsItems]);
  return (
    <div className="container-fluid homepage-container">
      <HeroBanner
        totalProducts={totalProducts}
        productCategoryCount={productCategoryCount}
        hotVouchers={hotVouchers}
      />

      <section id="featured-multi-brands" className="mt-5">
        <div className="d-flex align-items-end justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="section-title">Sản phẩm nổi bật từ nhiều nhãn hàng</h2>
            <div className="section-subtitle">
              Nhấn vào
              bất kỳ sản phẩm nào để mở trang nhãn hàng thực tế.
            </div>
          </div>
        </div>

        <div className="featured-showcase-grid mt-3">
          {featuredShowcaseProducts.map((product, index) => (
            <a
              key={product.id}
              href={getBrandUrl(product.brand, brandUrls)}
              target="_blank"
              rel="noreferrer"
              className={`featured-showcase-card featured-showcase-card-${index + 1}`}
            >
              <div className="featured-showcase-image-wrap">
                {product.discount > 0 && (
                  <div className="featured-showcase-discount-badge">
                    -{product.discount}%
                  </div>
                )}
                <img
                  src={product.image}
                  alt={product.name}
                  className="featured-showcase-image"
                />
              </div>

              <div className="featured-showcase-content">
                <div className="featured-showcase-brand">{product.brand}</div>
                <h3 className="featured-showcase-title">{product.name}</h3>
                <div className="featured-showcase-price-wrap">
                  <span className="featured-showcase-sale-price">
                    {formatVnd(product.price)}
                  </span>
                  {product.discount > 0 && (
                    <span className="featured-showcase-old-price">
                      {formatVnd(getOriginalPrice(product.price, product.discount))}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="hot-promotions" className="mt-5">
        <div className="flash-deals-head">
          <div className="flash-deals-title-wrap">
            <h2 className="flash-deals-title">Flash Deals</h2>
            <div className="flash-deals-timer">
              <span className="flash-time-chip">{formatTimePart(flashDealHours)}</span>
              <span className="flash-time-sep">:</span>
              <span className="flash-time-chip">{formatTimePart(flashDealMinutes)}</span>
              <span className="flash-time-sep">:</span>
              <span className="flash-time-chip">{formatTimePart(flashDealSeconds)}</span>
            </div>
          </div>
          <button
            type="button"
            className="flash-deals-viewall"
            onClick={() => navigate("/san-pham")}
          >
            Xem tất cả
          </button>
        </div>

        <div className="row g-3 mt-1">
          {hotPromotionProducts.map((product, index) => {
            const soldPercent = Math.min(
              92,
              Math.max(25, (product.discount || 0) * 2 + 18 + index * 4)
            );

            return (
              <div key={product.id} className="col-12 col-sm-6 col-lg-4 col-xl-2">
                <div className="flash-deal-item-shell">
                  <ProductCard product={product} />
                  <div className="flash-deal-progress" role="presentation">
                    <span style={{ width: `${soldPercent}%` }} />
                  </div>
                  <div className="flash-deal-progress-text">Đã bán {soldPercent}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="office" className="mt-5">
        <div className="d-flex align-items-end justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="section-title">Danh sách văn phòng</h2>
            <div className="section-subtitle">
              Xem thông tin liên hệ và địa chỉ của hệ thống PinkyCloud.
            </div>
          </div>
        </div>

        <div className="row g-4 mt-3">
          {officeLocations.map((office) => (
            <div key={office.title} className="col-12 col-md-4">
              <div className="card h-100 office-card">
                <div className="card-body d-flex flex-column">
                  <div className="office-meta">Văn phòng PinkyCloud</div>
                  <h3 className="card-title office-title">{office.title}</h3>
                  <p className="office-description">{office.description}</p>
                  <div className="office-contact">Email: {office.contact}</div>
                  <div className="office-contact">Hotline: {office.phone}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="news" className="mt-5">
        <div className="d-flex align-items-end justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="section-title">Tin tức nổi bật</h2>
            <div className="section-subtitle">
              Cập nhật xu hướng, mẹo chăm sóc da và thông tin sản phẩm mới nhất.
            </div>
          </div>
        </div>

        <div className="row g-4 mt-3">
          {latestNewsItems.length > 0 ? (
            latestNewsItems.map((news) => (
              <div key={news.id} className="col-12 col-md-6 col-xl-4">
                <div className="card h-100 news-card">
                  <div className="news-card-body">
                    <div className="news-date">{news.date}</div>
                    <h3 className="news-title">{news.title}</h3>
                    <p className="news-excerpt">{news.excerpt}</p>
                    <button
                      type="button"
                      className="btn news-btn btn-pink"
                      onClick={() => navigate(`/tin-tuc/${news.slug}`)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="card news-card">
                <div className="news-card-body">
                  Không tìm thấy bài viết phù hợp với từ khóa "{query.trim()}".
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
