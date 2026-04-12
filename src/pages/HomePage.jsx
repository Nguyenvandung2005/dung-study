import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/HomePage.css";
import { products } from "../data/products";
import brandUrls from "../data/brandUrls.json";
import officeLocations from "../data/officeLocations.json";
import hotVouchers from "../data/hotVouchers.json";
import newsItems from "../data/newsItems.json";

function getBrandUrl(brand) {
  return brandUrls[brand] || `https://www.google.com/search?q=${encodeURIComponent(brand)}`;
}

function shuffleArray(array) {
  const newArray = [...array];

  for (let i = newArray.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
}

function parseVietnameseDate(dateString) {
  const [day, month, year] = dateString.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
}

const bannerImages = [
  "/IMG/banner01.png",
  "/IMG/banner02.png",
  "/IMG/banner03.png",
  "/IMG/banner04.png",
  "/IMG/banner05.png",
  "/IMG/banner06.png"
];

const loopImages = [...bannerImages, bannerImages[0]];

const productCategoryCount = new Set(products.map((p) => p.category)).size;
const totalProducts = products.length;

function HeroBanner({ totalProducts, productCategoryCount }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
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

  const handleTransitionEnd = () => {
    if (activeSlide >= bannerImages.length) {
      setIsTransitioning(false);
      setActiveSlide(0);
    }
  };

  useEffect(() => {
    if (activeSlide > bannerImages.length) {
      setIsTransitioning(false);
      setActiveSlide(0);
    }
  }, [activeSlide]);

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
          <div className="hero-voucher-popup mt-2 rounded-4">
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

export default function HomePage() {
  const navigate = useNavigate();

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

  const featuredProductsFromMultipleBrands = useMemo(() => {
    return shuffleArray(products).slice(0, 8);
  }, []);

  const featuredShowcaseProducts = useMemo(() => {
    return featuredProductsFromMultipleBrands.slice(0, 4);
  }, [featuredProductsFromMultipleBrands]);

  const latestNewsItems = useMemo(() => {
    return [...newsItems]
      .sort((a, b) => parseVietnameseDate(b.date) - parseVietnameseDate(a.date))
      .slice(0, 3);
  }, []);

  return (
    <div className="container-fluid homepage-container">
      <HeroBanner
        totalProducts={totalProducts}
        productCategoryCount={productCategoryCount}
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
              href={getBrandUrl(product.brand)}
              target="_blank"
              rel="noreferrer"
              className={`featured-showcase-card featured-showcase-card-${index + 1}`}
            >
              <div className="featured-showcase-image-wrap">
                <img
                  src={product.image}
                  alt={product.name}
                  className="featured-showcase-image"
                />
              </div>

              <div className="featured-showcase-content">
                <div className="featured-showcase-brand">{product.brand}</div>
                <h3 className="featured-showcase-title">{product.name}</h3>
              </div>
            </a>
          ))}
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
          {latestNewsItems.map((news) => (
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
          ))}
        </div>
      </section>
    </div>
  );
}
