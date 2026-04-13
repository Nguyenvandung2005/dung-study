import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/HomePage.css";
import ProductCard from "../components/ProductCard";
import productsSource from "../data/products.json";
import brandUrls from "../data/brandUrls.json";
import officeLocations from "../data/officeLocations.json";
import hotVouchers from "../data/hotVouchers.json";
import newsItems from "../data/newsItems.json";

const products = Array.isArray(productsSource) //Khai báo productsSource là một mảng
  ? productsSource
  : productsSource.products ?? []; //Kiểm tra productsSource có phải là một mảng hay không, 
  // nếu không thì lấy productsSource.products nếu tồn tại, nếu không thì trả về mảng rỗng

function getBrandUrl(brand) {
  return brandUrls[brand] || `https://www.google.com/search?q=${encodeURIComponent(brand)}`;
} // Lấy url của thương hiệu của sản phẩm, 
// nếu không có thì trả về url tìm kiếm trên google cho thương hiệu đó
function shuffleArray(array) { //Hàm dùng để xáo trộn ngẫu nhiên một mảng
  const newArray = [...array]; // Tạo một bản sao của mảng gốc để tránh thay đổi mảng gốc

  for (let i = newArray.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1)); //Tạo ngẫu nhiên một chỉ số j từ 0 đến i
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Hoán đổi phần tử tại chỉ số i với phần tử tại chỉ số j
  }// Sử dụng thuật toán Fisher-Yates để xáo trộn mảng một cách hiệu quả và ngẫu nhiên

  return newArray;
}

function parseVietnameseDate(dateString) {// Hàm dùng để chuyển đổi chuỗi ngày tháng theo định dạng Việt Nam (dd/mm/yyyy) thành timestamp
  const [day, month, year] = dateString.split("/").map(Number);//Tách chuỗi ngày thành một mảng STring 
  // -> chuyển thành number và gán lần lượt cho day, month, year
  return new Date(year, month - 1, day).getTime(); // Tạo một đối tượng Date mới với năm, tháng 
  // (giảm 1 vì tháng trong JavaScript bắt đầu từ 0) và ngày, sau đó trả về timestamp của ngày đó
}

function formatVnd(value) { // Hàm dùng để định dạng một số thành chuỗi tiền tệ Việt Nam đồng (VND)
  return `${value.toLocaleString("vi-VN")} đ`;
}

function getOriginalPrice(price, discount = 0) {// Hàm dùng để tính giá gốc của sản phẩm dựa 
  if (!discount || discount <= 0) return null;//trên giá hiện tại và phần trăm giảm giá
  return Math.round(price / (1 - discount / 100));//Math.round dùng để làm tròn tiền
}

function formatTimePart(value) { // Hàm dùng để định dạng một phần của thời gian (giờ, phút, giây) thành chuỗi có 2 chữ số,
// nếu giá trị nhỏ hơn 10 thì sẽ thêm số 0 vào trước
  return String(value).padStart(2, "0");
}

const bannerImages = [ //Khai báo một mảng chứa đường dẫn của các hình ảnh banner sẽ được sử dụng trong trang chủ
  "/IMG/banner01.png",
  "/IMG/banner02.png",
  "/IMG/banner03.png",
  "/IMG/banner04.png",
  "/IMG/banner05.png",
  "/IMG/banner06.png"
];

const loopImages = [...bannerImages, bannerImages[0]];// Tạo một mảng mới bằng cách sao chép tất cả 
// phần tử của bannerImages và thêm phần tử đầu tiên của bannerImages vào cuối mảng mới

const productCategoryCount = new Set(products.map((p) => p.category)).size;
// Tạo một tập hợp (Set) từ các danh mục của sản phẩm để loại bỏ các danh mục trùng lặp,
const totalProducts = products.length;
// Đếm số lượng sản phẩm trong mảng products và lưu vào biến totalProducts

function HeroBanner({ totalProducts, productCategoryCount }) {
  const [activeSlide, setActiveSlide] = useState(0);
  // Khai báo một state activeSlide để lưu trữ chỉ số của slide hiện tại đang hiển thị,
  const [isTransitioning, setIsTransitioning] = useState(true);
  // Khai báo một state isTransitioning để lưu trữ trạng thái chuyển đổi của slider,
  const [showVouchers, setShowVouchers] = useState(false);
  // Khai báo một state showVouchers để lưu trữ trạng thái hiển thị của popup voucher hotdeal
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        if (prev >= bannerImages.length) {
          return bannerImages.length;
        }
        return prev + 1;
        // Cập nhật activeSlide lên chỉ số tiếp theo, nếu đã vượt quá số lượng banner thì giữ nguyên chỉ số cuối cùng (để hiển thị slide clone)
      });
    }, 4200); // Sử dụng useEffect để thiết lập một interval tự động thay đổi slide sau mỗi 4200ms (4.2 giây)

    return () => clearInterval(interval);
    // Trả về một hàm dọn dẹp để xóa interval khi component bị unmount hoặc khi activeSlide thay đổi,
  }, []);

  const handleTransitionEnd = () => { // Hàm xử lý sự kiện khi kết thúc chuyển đổi slide
    if (activeSlide >= bannerImages.length) { // Kiểm tra nếu activeSlide đã vượt quá số lượng banner (đang hiển thị slide clone)
      setIsTransitioning(false);// Tắt hiệu ứng chuyển đổi để có thể nhảy về slide đầu tiên mà không bị animation
      setActiveSlide(0);// Đặt activeSlide về 0 để hiển thị slide đầu tiên (đồng thời là slide clone) mà không có hiệu ứng chuyển đổi, tạo cảm giác liền mạch khi slider quay vòng
    }
  };

  useEffect(() => {
    if (activeSlide > bannerImages.length) {
      setIsTransitioning(false);
      setActiveSlide(0);
    }
  }, [activeSlide]);
  //Đây là một phương thức dự phòng để đảm bảo rằng nếu vì lý do nào đó activeSlide 
  // vượt quá số lượng banner (ví dụ do lỗi hoặc thay đổi không mong muốn), 
  // thì slider vẫn sẽ được reset về slide đầu tiên một cách an toàn mà không bị kẹt ở trạng thái chuyển đổi

  useEffect(() => { // Sử dụng useEffect để thiết lập lại trạng thái chuyển đổi sau khi đã nhảy về slide đầu tiên
    if (!isTransitioning) { // Kiểm tra nếu đang không ở trạng thái chuyển đổi (đã nhảy về slide đầu tiên)
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      // Sử dụng requestAnimationFrame hai lần để đảm bảo rằng việc bật lại hiệu ứng chuyển 
      // đổi sẽ xảy ra sau khi trình duyệt đã hoàn tất việc cập nhật DOM và đã hiển thị slide đầu tiên, tránh việc bật lại hiệu ứng quá

      return () => cancelAnimationFrame(raf);
      // Trả về một hàm dọn dẹp để hủy bỏ requestAnimationFrame nếu component bị unmount hoặc 
      // nếu isTransitioning thay đổi trước khi requestAnimationFrame được thực thi, giúp tránh lỗi và rò rỉ bộ nhớ.
    }
  }, [isTransitioning]);

  return (
    <section className="hero-banner rounded-4 position-relative overflow-hidden">
      <div className="hero-hotdeal position-absolute top-0 end-0 mt-3 me-3">
        {/* Nút Hotdeal được đặt ở góc trên bên phải của banner */}
        <button
          onClick={() => setShowVouchers((prev) => !prev)}
          className="btn btn-sm btn-outline-danger hero-hotdeal-btn"
        >
          Hotdeal
        </button>
        {/* Khi người dùng nhấp vào nút Hotdeal, trạng thái showVouchers sẽ được chuyển đổi giữa true và false,
        điều này sẽ điều khiển việc hiển thị hoặc ẩn popup voucher hotdeal bên dưới nút. */}
        {showVouchers && (
          <div className="hero-voucher-popup mt-2 rounded-4">
            <div className="hero-voucher-grid">
              {hotVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="hero-voucher-card rounded-4"
                  style={{ background: voucher.accent }} //Mỗi voucher sẽ có một màu nền khác nhau được lấy từ thuộc tính accent của voucher trong dữ liệu hotVouchers, tạo sự nổi bật và dễ phân biệt giữa các voucher khi hiển thị trong popup.
                >
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div> 
                      {/* Trái */}
                      <div className="hero-voucher-label">VOUCHER HOT</div>
                      <h3 className="hero-voucher-title">{voucher.title}</h3>
                      <div className="hero-voucher-detail">{voucher.detail}</div>
                    </div>
                    <div className="hero-voucher-code rounded-4"> 
                      {/* Phải */}
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
        {/* Hiệu ứng màu nền của banner */}
      <div className="hero-slider-wrapper position-absolute top-0 end-0 h-100">
        <div className="hero-slider-mask position-absolute top-0 start-0 w-100 h-100">
          <div
            onTransitionEnd={handleTransitionEnd}
            className="hero-slider-track"
            style={{
              width: `${loopImages.length * 100}%`,
              transform: `translateX(-${activeSlide * (100 / loopImages.length)}%)`,
              // Dịch chuyển các slide từ phải sang trái
              transition: isTransitioning
                ? "transform 1400ms cubic-bezier(0.4, 0, 0.2, 1)" //Tạo hiệu ứng chuyển đổi từ trái sang phải với thời gian 1400ms và sử dụng hàm easing cubic-bezier để tạo cảm giác mượt mà hơn
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
        {/* Các lớp phủ để tạo hiệu ứng trên banner */}
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
  const navigate = useNavigate();//Hook cuar React Router để điều hướng giữa các trang trong ứng dụng, cho phép chuyển hướng đến các trang khác khi người dùng tương tác với các phần tử trên trang chủ.
  const [flashDealsSecondsLeft, setFlashDealsSecondsLeft] = useState(
    1 * 3600 + 32 * 60 + 54
  ); // State để đếm ngược thời gian còn lại cho Flash Deals, được khởi tạo với giá trị tương đương 1 giờ, 32 phút và 54 giây (tổng cộng là 5574 giây)

  useEffect(() => {
    const fontId = "playfair-display-font";
    //Dùng để load font Playfair Display từ Google Fonts, 
    // đảm bảo rằng font này chỉ được thêm vào tài liệu một lần duy nhất, 
    // tránh việc tải lại font nhiều lần khi component được render lại nhiều lần hoặc khi người dùng tương tác với trang chủ.
    if (!document.getElementById(fontId)) { //Kiểm tra font đã tồn tại chưa
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap";
      document.head.appendChild(link);
    }
    //Nếu chưa thì thiết lập để tải font từ google về
  }, []);

  const featuredProductsFromMultipleBrands = useMemo(() => {
    return shuffleArray(products).slice(0, 8);
  }, []); // Sử dụng useMemo để tạo một mảng gồm 8 sản phẩm nổi bật được chọn ngẫu nhiên từ mảng products,
  // đảm bảo rằng việc xáo trộn và chọn sản phẩm chỉ xảy ra một lần khi component được mount, 
  // giúp cải thiện hiệu suất bằng cách tránh việc tính toán lại mỗi khi component re-render. 
  // Việc sử dụng shuffleArray giúp đảm bảo rằng mỗi lần người dùng truy cập trang chủ sẽ thấy một tập hợp sản phẩm nổi bật khác nhau, tạo sự mới mẻ và hấp dẫn hơn.

  const featuredShowcaseProducts = useMemo(() => {
    return featuredProductsFromMultipleBrands.slice(0, 4);
  }, [featuredProductsFromMultipleBrands]);
  // Sử dụng useMemo để tạo một mảng gồm 4 sản phẩm nổi bật được chọn từ mảng featuredProductsFromMultipleBrands,

  const hotPromotionProducts = useMemo(() => {
    return [...products]
      .filter((product) => (product.discount || 0) > 0)
      .sort((a, b) => (b.discount || 0) - (a.discount || 0))
      .slice(0, 6);
  }, []);
  // Sử dụng useMemo để tạo một mảng gồm 6 sản phẩm có khuyến mãi tốt nhất (có phần trăm giảm giá cao nhất) được chọn từ mảng products,
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashDealsSecondsLeft((prev) =>
        prev <= 1 ? 1 * 3600 + 32 * 60 + 54 : prev - 1
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  //Thực hiện đếm ngược thời gian theo giây
  //Khi thời gian kết thúc thì reset lại 

  const flashDealHours = Math.floor(flashDealsSecondsLeft / 3600);
  const flashDealMinutes = Math.floor((flashDealsSecondsLeft % 3600) / 60);
  const flashDealSeconds = flashDealsSecondsLeft % 60;
  //Tách thời gian theo giờ, phút, giây
  const latestNewsItems = useMemo(() => {
    return [...newsItems]
      .sort((a, b) => parseVietnameseDate(b.date) - parseVietnameseDate(a.date))
      .slice(0, 3);
  }, []); //Lọc tin tức mới nhất bằng cách sắp xếp theo thời gian

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
              //Mở một tab mới
              rel="noreferrer"
              //Đảm bảo an toàn khi mở liên kết ngoài bằng cách ngăn chặn việc truyền referrer và tránh các lỗ hổng bảo mật tiềm ẩn
              className={`featured-showcase-card featured-showcase-card-${index + 1}`}
            >
              <div className="featured-showcase-image-wrap">
                {/* Hiển thị badge giảm giá */}
                {product.discount > 0 && (
                  <div className="featured-showcase-discount-badge">
                    -{product.discount}%
                  </div>
                )}
                {/* Hiển thị hình ảnh sản phẩm */}
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
