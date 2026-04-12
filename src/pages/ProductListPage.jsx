import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import useFetch from "../hooks/useFetch";

export default function ProductListPage({ query = "" }) {
  //  Fetch toàn bộ sản phẩm từ API 
  const { data, loading, error } = useFetch("/api/products");

  // Lấy tham số ?category=... từ URL 
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  //  State điều khiển bộ lọc & phân trang 
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular"); // kiểu sắp xếp
  const [page, setPage] = useState(1);         // trang hiện tại

  const itemsPerPage = 12; // số sản phẩm mỗi trang

  // Đảm bảo data luôn là array dù API trả về null/undefined
  const productsData = Array.isArray(data) ? data : [];

  //  Khi URL thay đổi category
  useEffect(() => {
    setCategory(categoryFromUrl || "all");
    setPage(1);
  }, [categoryFromUrl]);

  //  bỏ khoảng trắng, chuyển thường
  const normalizedQuery = query.trim().toLowerCase();

  //  Tạo danh sách danh mục từ dữ liệu sản phẩm 
  const categories = useMemo(() => {
    const set = new Set(productsData.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [productsData]);

  // Lọc + sắp xếp sản phẩm 
  const filteredAndSorted = useMemo(() => {
    let result = productsData.filter((p) => {
      // Khớp từ khóa tìm kiếm với tên hoặc thương hiệu
      const matchQuery =
        !normalizedQuery ||
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.brand.toLowerCase().includes(normalizedQuery);

      // Khớp danh mục đang chọn
      const matchCategory =
        category === "all" ||
        p.category.toLowerCase() === category.toLowerCase();

      return matchQuery && matchCategory;
    });

    // Sắp xếp theo lựa chọn của user
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);       // giá tăng dần
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);       // giá giảm dần
        break;
      case "hot":
        result.sort((a, b) => (b.discount || 0) - (a.discount || 0)); // discount cao nhất lên đầu
        break;
      default:
        break; // "popular" → giữ nguyên
    }

    return result;
  }, [productsData, normalizedQuery, category, sortBy]);

  //  Tính toán phân trang 
  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / itemsPerPage));
  const safePage = Math.min(page, totalPages); // tránh page vượt quá tổng số trang
  const pageItems = filteredAndSorted.slice(    // cắt đúng slice cho trang hiện tại
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  //  Style động cho các nút sắp xếp (active vs inactive)
  const getSortBtnStyle = (isActive) => ({
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "0.95rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease",
    backgroundColor: isActive ? "#f0f5ff" : "#f8f9fa",
    color: isActive ? "#2b6cb0" : "#333",
    border: isActive ? "1px solid #3182ce" : "1px solid #e9ecef",
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  // ─── Trạng thái loading / error 
  if (loading) return (
    <div className="container py-5 text-center">
      <div className="spinner-border text-danger" role="status"></div>
    </div>
  );
  if (error) return (
    <div className="container py-5 text-center text-danger">
      <h4>Lỗi: {error}</h4>
    </div>
  );


  return (
    <div className="container-fluid" style={{ marginTop: 24, marginBottom: 80, padding: "0 5%" }}>

      {/* Breadcrumb điều hướng: Trang chủ > Bộ sưu tập */}
      <div className="mb-3">
        <nav style={{ fontSize: "0.9rem" }}>
          <Link to="/" style={{ textDecoration: "none", color: "#6c757d" }}>Trang chủ</Link>
          <span style={{ margin: "0 8px", color: "#6c757d" }}>&gt;</span>
          <span style={{ color: "#333", fontWeight: 600 }}>Bộ sưu tập</span>
        </nav>
      </div>

      {/* Thanh lọc danh mục — scroll ngang trên mobile */}
      <div className="d-flex flex-nowrap overflow-auto mb-4 pb-2" style={{ gap: "12px", WebkitOverflowScrolling: "touch" }}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => { setCategory(c); setPage(1); }}
            style={{
              padding: "8px 24px",
              background: category === c ? "#f0f5ff" : "#fff",
              border: `1px solid ${category === c ? "#3182ce" : "#eaeaea"}`,
              color: category === c ? "#2b6cb0" : "#555",
              fontWeight: category === c ? "600" : "500",
              borderRadius: "30px",
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {c === "all" ? "Tất cả" : c}
          </button>
        ))}
      </div>

      {/* Thanh thông tin + sắp xếp */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-4 p-3"
        style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f0f0f0" }}>

        {/* Số lượng sản phẩm tìm được */}
        <div style={{ opacity: 0.8, fontSize: "0.95rem", marginBottom: "12px", display: "flex", alignItems: "center" }}>
          Tìm thấy <b className="mx-1">{filteredAndSorted.length}</b> sản phẩm phù hợp
        </div>

        {/* Nhóm nút sắp xếp */}
        <div className="d-flex flex-wrap align-items-center gap-3">
          <span style={{ fontSize: "1rem", fontWeight: 700, color: "#222" }}>Sắp xếp theo</span>
          <button onClick={() => { setSortBy("popular"); setPage(1); }} style={getSortBtnStyle(sortBy === "popular")}>Phổ biến</button>
          <button onClick={() => { setSortBy("hot"); setPage(1); }} style={getSortBtnStyle(sortBy === "hot")}>Khuyến mãi HOT</button>
          <button onClick={() => { setSortBy("price-asc"); setPage(1); }} style={getSortBtnStyle(sortBy === "price-asc")}>Giá thấp - cao</button>
          <button onClick={() => { setSortBy("price-desc"); setPage(1); }} style={getSortBtnStyle(sortBy === "price-desc")}>Giá cao - thấp</button>
        </div>
      </div>

      {/* Grid sản phẩm  */}
      <div className="row g-4">
        {pageItems.length > 0 ? (
          pageItems.map((p) => (
            <div key={p.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <ProductCard product={p} />
            </div>
          ))
        ) : (
          // Hiển thị khi không có sản phẩm nào khớp
          <div className="col-12 text-center py-5">
            <h4 className="text-muted mt-3">Không tìm thấy sản phẩm nào...</h4>
            <p className="text-secondary">Hãy thử tìm kiếm với từ khóa khác hoặc đổi danh mục.</p>
          </div>
        )}
      </div>

      {/* Phân trang — chỉ hiện khi có hơn 1 trang */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
          <button className="btn btn-outline-secondary" onClick={() => setPage(1)} disabled={safePage === 1} style={{ borderRadius: "8px" }}>Đầu</button>
          <button className="btn btn-outline-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} style={{ borderRadius: "8px" }}>Trước</button>
          <div className="mx-3" style={{ fontWeight: 600 }}>
            Trang <span style={{ color: "#f76c85" }}>{safePage}</span> / {totalPages}
          </div>
          <button className="btn btn-outline-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ borderRadius: "8px" }}>Tiếp</button>
          <button className="btn btn-outline-secondary" onClick={() => setPage(totalPages)} disabled={safePage === totalPages} style={{ borderRadius: "8px" }}>Cuối</button>
        </div>
      )}
    </div>
  );
}