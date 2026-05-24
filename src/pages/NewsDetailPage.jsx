import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/NewsDetailPage.css";
import useFetch from "../hooks/useFetch";

// Danh sách ảnh dự phòng khi bài viết không có ảnh hoặc ảnh bị lỗi
const fallbackImages = [
  "/IMG/anh31.png",
  "/IMG/anh32.png",
  "/IMG/anh33.png",
  "/IMG/anh34.png",
  "/IMG/anh35.png",
  "/IMG/anh36.png",
];


function splitContentToParagraphs(content = "") {
  return content
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean); // Loại bỏ các dòng trống
}

function getNewsImage(item) {
  if (item?.image) return item.image;
  return fallbackImages[item.id % fallbackImages.length];
}

export default function NewsDetailPage({ searchNotice = "" }) {
  const { slug } = useParams(); // Lấy tham số 'slug' từ URL (ví dụ: /tin-tuc/bi-quyet-cham-soc-da)
  const navigate = useNavigate(); // Hook dùng để chuyển trang bằng lập trình

  // Gọi API lấy danh sách tin tức
  const { data: newsItemsData, loading } = useFetch("/api/news-items");
  const newsItems = Array.isArray(newsItemsData) ? newsItemsData : [];

  // Tìm bài viết cụ thể dựa trên slug đã lấy từ URL
  const selectedNews = newsItems.find((item) => item.slug === slug);

  // Giao diện hiển thị khi dữ liệu đang được tải
  if (loading) {
    return (
      <section className="container news-detail-page py-5">
        <div className="news-detail-card news-not-found text-center">
          <div className="spinner-border text-pink mb-3" role="status"></div>
          <p className="news-detail-summary">Đang tải bài viết, vui lòng đợi...</p>
        </div>
      </section>
    );
  }

  // Xử lý trường hợp không tìm thấy bài viết hoặc slug sai
  if (!selectedNews) {
    return (
      <section className="container news-detail-page py-5">
        <div className="news-detail-card news-not-found text-center">
          <h1 className="news-detail-title">Không tìm thấy bài viết</h1>
          <p className="news-detail-summary">
            Bài viết bạn chọn không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <button
            type="button"
            className="btn news-back-btn btn-pink mt-3"
            onClick={() => navigate("/")}
          >
            Quay về Trang chủ
          </button>
        </div>
      </section>
    );
  }

  // Chuẩn bị dữ liệu để hiển thị
  const paragraphs = splitContentToParagraphs(selectedNews.content);

  // Lấy danh sách tin tức liên quan (loại trừ bài hiện tại và lấy tối đa 3 bài)
  const relatedNews = newsItems.filter((item) => item.slug !== slug).slice(0, 3);

  const mainImage = getNewsImage(selectedNews);

  return (
    <section className="container news-detail-page py-5">
      {searchNotice && (
        <div className="alert alert-warning news-search-notice mb-4" role="alert">
          {searchNotice}
        </div>
      )}

      {/* Nội dung chi tiết bài viết */}
      <article className="news-detail-card">
        <div className="news-detail-meta">
          <span className="me-3"><i className="bi bi-calendar-event"></i> {selectedNews.date}</span>
          <span className="me-3"><i className="bi bi-tag"></i> {selectedNews.category}</span>
          <span><i className="bi bi-clock"></i> {selectedNews.readTime}</span>
        </div>

        <h1 className="news-detail-title">{selectedNews.title}</h1>
        <p className="news-detail-summary">{selectedNews.excerpt}</p>

        <div className="news-detail-image-wrap">
          <img
            src={mainImage}
            alt={selectedNews.title}
            className="news-detail-image"
            // Nếu ảnh bị lỗi khi tải, thay bằng ảnh dự phòng đầu tiên
            onError={(e) => {
              e.currentTarget.src = fallbackImages[0];
            }}
          />
        </div>

        <div className="news-detail-content">
          {paragraphs.map((paragraph, index) => (
            <p key={`${selectedNews.slug}-p-${index}`}>{paragraph}</p>
          ))}
        </div>

        <div className="news-detail-actions text-center mt-5">
          <button
            type="button"
            className="btn news-back-btn btn-outline-pink"
            onClick={() => navigate("/tin-tuc")}
          >
            <i className="bi bi-arrow-left"></i> Quay lại Trang chủ
          </button>
        </div>
      </article>

      {/* Phần tin tức liên quan (Sidebar hoặc Bottom bar) */}
      <aside className="news-related-section mt-5">
        <h2 className="news-related-title mb-4">Tin tức liên quan</h2>
        <div className="row g-4">
          {relatedNews.map((item, index) => (
            <div key={item.id} className="col-12 col-md-4">
              <div className="card h-100 news-related-card border-0 shadow-sm">
                <div className="news-related-image-wrap">
                  <img
                    src={getNewsImage(item)}
                    alt={item.title}
                    className="news-related-image"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImages[index % fallbackImages.length];
                    }}
                  />
                </div>

                <div className="news-card-body p-3">
                  <div className="news-date text-muted small mb-2">{item.date}</div>
                  <h3 className="news-related-item-title h6">{item.title}</h3>
                  <p className="news-excerpt text-secondary small line-clamp-2">
                    {item.excerpt}
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-pink w-100 mt-2"
                    onClick={() => navigate(`/tin-tuc/${item.slug}`)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
