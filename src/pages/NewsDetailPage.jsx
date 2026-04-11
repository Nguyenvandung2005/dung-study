import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import newsItems from "../data/newsItems.json";
import "../css/NewsDetailPage.css";

const fallbackImages = [
  "/IMG/anh31.png",
  "/IMG/anh32.png",
  "/IMG/anh33.png",
  "/IMG/anh34.png",
  "/IMG/anh35.png",
  "/IMG/anh36.png",
];

// Tách nội dung bài viết thành các đoạn theo dòng để render dễ đọc.
function splitContentToParagraphs(content = "") {
  return content
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// Ưu tiên ảnh từ dữ liệu bài viết; nếu thiếu thì dùng ảnh fallback theo id.
function getNewsImage(item) {
  if (item?.image) return item.image;
  return fallbackImages[item.id % fallbackImages.length];
}

export default function NewsDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Tìm bài viết theo slug trên URL.
  const selectedNews = newsItems.find((item) => item.slug === slug);

  // Nhánh xử lý khi URL không khớp bài viết nào.
  if (!selectedNews) {
    return (
      <section className="container news-detail-page py-5">
        <div className="news-detail-card news-not-found">
          <h1 className="news-detail-title">Không tìm thấy bài viết</h1>
          <p className="news-detail-summary">
            Bài viết bạn chọn không tồn tại hoặc đã bị xóa.
          </p>
          <button
            type="button"
            className="btn news-back-btn"
            onClick={() => navigate("/")}
          >
            Quay về Trang chủ
          </button>
        </div>
      </section>
    );
  }

  // Chuẩn bị dữ liệu hiển thị cho bài hiện tại và danh sách liên quan.
  const paragraphs = splitContentToParagraphs(selectedNews.content);
  const relatedNews = newsItems.filter((item) => item.slug !== slug).slice(0, 3);
  const mainImage = getNewsImage(selectedNews);

  return (
    <section className="container news-detail-page py-5">
      <article className="news-detail-card">
        <div className="news-detail-meta">
          <span>{selectedNews.date}</span>
          <span>{selectedNews.category}</span>
          <span>{selectedNews.readTime}</span>
        </div>

        <h1 className="news-detail-title">{selectedNews.title}</h1>
        <p className="news-detail-summary">{selectedNews.excerpt}</p>

        <div className="news-detail-image-wrap">
          <img
            src={mainImage}
            alt={selectedNews.title}
            className="news-detail-image"
            // Nếu ảnh lỗi thì thay bằng fallback đầu tiên để tránh ảnh vỡ.
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

        <div className="news-detail-actions">
          <button
            type="button"
            className="btn news-back-btn"
            onClick={() => navigate("/")}
          >
            Quay về Trang chủ
          </button>
        </div>
      </article>

      <aside className="news-related-section">
        <h2 className="news-related-title">Tin tức khác</h2>
        <div className="row g-3 mt-1">
          {relatedNews.map((item, index) => (
            <div key={item.id} className="col-12 col-md-4">
              <div className="card h-100 news-related-card">
                <div className="news-related-image-wrap">
                  <img
                    src={getNewsImage(item)}
                    alt={item.title}
                    className="news-related-image"
                    // Fallback theo index để danh sách liên quan vẫn có ảnh hiển thị.
                    onError={(e) => {
                      e.currentTarget.src =
                        fallbackImages[index % fallbackImages.length];
                    }}
                  />
                </div>

                <div className="news-card-body">
                  <div className="news-date">{item.date}</div>
                  <h3 className="news-related-item-title">{item.title}</h3>
                  <p className="news-excerpt">{item.excerpt}</p>
                  <button
                    type="button"
                    className="btn news-btn btn-pink"
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
