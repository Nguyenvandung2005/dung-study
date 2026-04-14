import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/HomePage.css";
import ProductCard from "../components/ProductCard";
import productsSource from "../data/products.json";
import brandUrls from "../data/brandUrls.json";
import officeLocations from "../data/officeLocations.json";
import hotVouchers from "../data/hotVouchers.json";
import newsItems from "../data/newsItems.json";

const products = Array.isArray(productsSource)
//Khai báo một mảng products bằng cách kiểm tra nếu productsSource là một mảng,
// nếu đúng thì gán trực tiếp, nếu không thì cố gắng truy cập vào thuộc tính products của nó. Nếu cả hai điều kiện
  ? productsSource
  : productsSource.products ?? [];

function getBrandUrl(brand) {
  return brandUrls[brand] || `https://www.google.com/search?q=${encodeURIComponent(brand)}`;
}//Hàm để lấy đường dẫn url của từng thương hiệu, nếu tồn tại thì mở đường dẫn
// Nếu không thì sẽ mở đường dẫn là trang tìm kiếm của google

function shuffleArray(array) {//Đây là hàm để xáo trộn mảng ngẫu nhiên
  const newArray = [...array];
  //Coppy một mảng mới từ mảng gốc để tránh làm thay đổi dữ liệu của mảng gốc
  for (let i = newArray.length - 1; i > 0; i -= 1) { 
    //Duyệt ngược từ phần tử cuối cùng đến phần tử đầu tiên của mảng mới
    const j = Math.floor(Math.random() * (i + 1));
    //chọn ngẫu nhiên một chỉ số j từ 0 đến i
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    //Hoán đổi vị trí các phần tử
  }
  return newArray;
}

function parseVietnameseDate(dateString) { //Hàm chuyển định dạng ngày về dạng timestamp để dễ dàng so sánh và sắp xếp
  const [day, month, year] = dateString.split("/").map(Number);
  //Tạo một đối tượng Date mảng với các phần tử là ngày tháng năm kiểu Number
  return new Date(year, month - 1, day).getTime();
  //Trả về đối tượng Date
}

function formatVnd(value) { //Hàm format tiền tệ Việt Nam
  return `${value.toLocaleString("vi-VN")} đ`;
}

function getOriginalPrice(price, discount = 0) {//Hàm tính giá tiền gốc dựa trên giá discount
  if (!discount || discount <= 0) return null;
  //Kiểm tra nếu không có discount hoặc discount nhỏ hơn hoặc bằng 0 thì trả về null
  return Math.round(price / (1 - discount / 100));
  //Ngược lại trả về giá gốc bằng cách chia giá hiện tại cho (1 - discount/100) và làm tròn kết quả.
}
function formatTimePart(value) {//Hàm format thời gian để hiển thị đếm ngược
  return String(value).padStart(2, "0");
  //Nếu giá trị nhỏ hơn 10 thì thêm 0 đằng trước
}

const bannerImages = [//Khai báo mảng chứa đường dẫn ảnh các banner
  "/IMG/banner01.png",
  "/IMG/banner02.png",
  "/IMG/banner03.png",
  "/IMG/banner04.png",
  "/IMG/banner05.png",
  "/IMG/banner06.png"
];

const loopImages = [...bannerImages, bannerImages[0]];
//Tạo một mảng mới bằng cách sao chép tất cả phần tử của bannerImages và thêm phần tử đầu tiên của mảng đó
const productCategoryCount = new Set(products.map((p) => p.category)).size;
//Tạo một thuộc tính productCategoryCount bằng cách sử dụng Set để đếm số lượng danh mục sản phẩm khác nhau trong mảng products.
const totalProducts = products.length;
//Tạo một thuộc tính totalProducts bằng cách lấy độ dài của mảng products, tức là tổng số sản phẩm có trong mảng đó.

function HeroBanner({ totalProducts, productCategoryCount }) {//Hàm thực hiện phần banner
  const [activeSlide, setActiveSlide] = useState(0);
  //Khai báo một state để kiểm soát slide đang hiển thị, bắt đầu bằng slide đầu tiên
  const [isTransitioning, setIsTransitioning] = useState(true);
  //Khai báo một state để kiểm soát trạng thái chuyển đổi của slider, bắt đầu bằng true để kích hoạt hiệu ứng chuyển đổi
  const [showVouchers, setShowVouchers] = useState(false);
  //Khai báo một state để kiểm soát việc hiển thị popup voucher, bắt đầu bằng false để ẩn popup
  useEffect(() => {//Sử dụng useEffect để thiết lập interval tự chuyển slide
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        if (prev >= bannerImages.length) {//Kiểm tra nếu slide hiện tại đã vượt quá số lượng ảnh banner
          return bannerImages.length;
          //Trả về chỉ số của phần tử cuối cùng
        }
        return prev + 1; //Ngược lại trả về chỉ số(slide) tiếp theo
      });
    }, 4200); //Thời gian chuyển slide là 4200ms (4.2 giây)

    return () => clearInterval(interval);//Hàm dọn dẹp, để xóa interval khi bị hủy, tránh rò rỉ
  }, []);

  const handleTransitionEnd = () => {//Hàm xủ lý khi kết thúc hiệu ứng chuyển đổi
    if (activeSlide >= bannerImages.length) {//Kiểm tra nếu slide hiện tại vượt quá số lượng slide
      setIsTransitioning(false); //Cập nhật trạng thái chuyển đổi là false
      setActiveSlide(0);//Cập nhật slide hiện tại về slide đầu tiên
    }
  };
  useEffect(() => {//Sử dụng useEffect để kích hoạt lại hiệu ứng chuyển đổi slide khi slide vượt quá
    if (!isTransitioning) {//Kiểm tra xem trạng thái hiện tại có phải là false
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {//Sử dụng requestAnimationFrame để đảm bảo rằng việc cập nhật trạng thái sẽ xảy ra sau khi trình duyệt đã hoàn thành việc vẽ lại giao diện
          setIsTransitioning(true); //Cập nhật lại trạng thái chuyển đổi là true
        });
      });

      return () => cancelAnimationFrame(raf);
      //Hàm dọn dẹp để hủy bỏ requestAnimationFrame khi bị hủy, tránh rò rỉ
    }
  }, [isTransitioning]);

  return (
    <section className="hero-banner rounded-4 position-relative overflow-hidden">
      <div className="hero-hotdeal position-absolute top-0 end-0 mt-3 me-3">
        <button
          onClick={() => setShowVouchers((prev) => !prev)}
          // Khi ấn 1 lần thì mở, 2 lần thì đóng
          className="btn btn-sm btn-outline-danger hero-hotdeal-btn"
        >
          Hotdeal
        </button>

        {showVouchers && ( //Nếu showVouchers là true thì hiển thị popup voucher
          <div className="hero-voucher-popup mt-2 rounded-4">
            <div className="hero-voucher-grid">
              {hotVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="hero-voucher-card rounded-4"
                  style={{ background: voucher.accent }}
                  //Mỗi voucher sẽ có một màu back riêng
                >
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div> 
                      {/* Bên trái */}
                      <div className="hero-voucher-label">VOUCHER HOT</div>
                      <h3 className="hero-voucher-title">{voucher.title}</h3>
                      <div className="hero-voucher-detail">{voucher.detail}</div>
                    </div>
                    <div className="hero-voucher-code rounded-4">
                      {voucher.code}
                      {/* Bên phải */}
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
              width: `${loopImages.length * 100}%`, //Mở rộng track để chứa tất cả các slide
              transform: `translateX(-${activeSlide * (100 / loopImages.length)}%)`,
              //Dịch chuyển track từ phải sang trái dựa trên slide hiện tại
              transition: isTransitioning
                ? "transform 1400ms cubic-bezier(0.4, 0, 0.2, 1)"
                : "none",
                //Nếu đang trong trạng thái chuyển đổi (true) thì tiếp tục
                //Ngược lại nếu đã chuyển xong (false) thì tắt hiệu ứng chuyển đổi để không bị nhảy khi reset về slide đầu tiên
            }}
          >
            {loopImages.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="hero-slide"
                style={{ width: `${100 / loopImages.length}%` }}
                //Mỗi slide sẽ có chiều rộng bằng 1 phần số lượng slide để vừa khít trong track
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
  const navigate = useNavigate(); //Sử dụng hook useNavigate để điều hướng trang
  const [flashDealsSecondsLeft, setFlashDealsSecondsLeft] = useState(
    1 * 3600 + 32 * 60 + 54
  );//Khai báo một state để đếm ngược thời gian, thời gian mặc định là 1h32p54s

  useEffect(() => {//Sử dụng useEffect để tải font chữ từ google
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
  }, []); //Sử dụng useMemo để tạo mảng 4 sản phẩm ngẫu nhiên từ mảng products

  const hotPromotionProducts = useMemo(() => {
    return [...products]
      .filter((product) => (product.discount || 0) > 0)
      .sort((a, b) => (b.discount || 0) - (a.discount || 0))
      .slice(0, 6); // || 0 để đảm bảo nếu sản phẩm không có discount thì mặc định là 0
  }, []); //Sử dụng useMemo để tạo mảng 6 sản phẩm có khuyến mãi cao nhất từ mảng products, 
  // lọc ra những sản phẩm có discount lớn hơn 0, sau đó sắp xếp giảm dần theo discount và lấy 6 phần tử đầu tiên

  useEffect(() => {//Sử dụng useEffect để thiết lập interval đếm ngược thời gian
    const interval = setInterval(() => {
      setFlashDealsSecondsLeft((prev) =>
        prev <= 1 ? 1 * 3600 + 32 * 60 + 54 : prev - 1 //Thời gian giảm theo giây
      );//Khi thời gian đếm ngược về 0 thì reset lại về 1h32p54s để tiếp tục đếm ngược cho đợt flash deal tiếp theo
    }, 1000);

    return () => clearInterval(interval);
    //Hàm làm sạch để xóa interval(bộ hẹn lặp) khi bị hủy tránh để rò rỉ
  }, []);

  const flashDealHours = Math.floor(flashDealsSecondsLeft / 3600);
  const flashDealMinutes = Math.floor((flashDealsSecondsLeft % 3600) / 60);
  const flashDealSeconds = flashDealsSecondsLeft % 60;
  const normalizedNewsQuery = query.trim().toLowerCase();
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
  }, [normalizedNewsQuery]);
  //Sử dụng useMemo để tạo mảng 3 phần tử đầu tiên từ mảng newItems đã được sắp xếp giảm dần theo thời gian
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
              target="_blank" //Mở liên kết ở một tab mới
              rel="noreferrer"//Bảo mật không cho phép truy cập thông tin ra bên ngoài
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
            onClick={() => navigate("/san-pham")} //Sử dụng navigate
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
