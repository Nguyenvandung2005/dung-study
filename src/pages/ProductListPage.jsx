import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import useProductsData from "../hooks/useProductsData";

export default function ProductListPage({ query = "" }) {
  //  Fetch toàn bộ sản phẩm từ API 
  const { products, loading, error } = useProductsData();

  //  Lấy tham số ?category=... từ URL
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  // State điều khiển bộ lọc & phân trang 
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [page, setPage] = useState(1);

  const itemsPerPage = 12; // số sản phẩm mỗi trang

  // Khi URL thay đổi category → cập nhật state & reset về trang 1
  useEffect(() => {
    setCategory(categoryFromUrl || "all");
    setPage(1);
  }, [categoryFromUrl]);

  // Chuẩn hóa từ khóa tìm kiếm: bỏ khoảng trắng, chuyển thường
  const normalizedQuery = query.trim().toLowerCase();

  //  Tạo danh sách danh mục từ dữ liệu sản phẩm (không trùng lặp ────────
  const categories = useMemo(() => {
    const categorySet = new Set(products.map((product) => product.category));
    return ["all", ...Array.from(categorySet)];
  }, [products]);

  //  Lọc + sắp xếp sản phẩm theo query, danh mục, kiểu sort
  const filteredAndSorted = useMemo(() => {
    const result = products.filter((product) => {
      // Khớp từ khóa tìm kiếm với tên hoặc thương hiệu
      const matchQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery);

      // Khớp danh mục đang chọn
      const matchCategory =
        category === "all" ||
        product.category.toLowerCase() === category.toLowerCase();

      return matchQuery && matchCategory;
    });

    // Sắp xếp theo lựa chọn của người dùng
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);                          // giá tăng dần
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);                          // giá giảm dần
        break;
      case "hot":
        result.sort((a, b) => (b.discount || 0) - (a.discount || 0));      // discount cao nhất lên đầu
        break;
      default:
        break; // "popular" → giữ nguyên thứ tự từ API
    }

    return result;
  }, [products, normalizedQuery, category, sortBy]);

  //  Tính toán phân trang
  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / itemsPerPage));
  const safePage = Math.min(page, totalPages); // tránh page vượt quá tổng số trang
  const pageItems = filteredAndSorted.slice(    // cắt đúng slice cho trang hiện tại
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  //  Style động cho nút sắp xếp (active vs inactive)
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

  // Trạng thái loading / error 
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center text-danger">
        <h4>Lỗi: {error}</h4>
      </div>
    );
  }


  return (
    <div className="container-fluid" style={{ marginTop: 24, marginBottom: 80, padding: "0 5%" }}>

      {/* Breadcrumb: Trang chủ > Bộ sưu tập */}
      <div className="mb-3">
        <nav style={{ fontSize: "0.9rem" }}>
          <Link to="/" style={{ textDecoration: "none", color: "#6c757d" }}>Trang chủ</Link>
          <span style={{ margin: "0 8px", color: "#6c757d" }}>&gt;</span>
          <span style={{ color: "#333", fontWeight: 600 }}>Bộ sưu tập</span>
        </nav>
      </div>

      {/* Thanh lọc danh mục — scroll ngang trên mobile */}
      <div className="d-flex flex-nowrap overflow-auto mb-4 pb-2" style={{ gap: "12px", WebkitOverflowScrolling: "touch" }}>
        {categories.map((value) => (
          <button
            key={value}
            onClick={() => { setCategory(value); setPage(1); }} // đổi danh mục + reset trang
            style={{
              padding: "8px 24px",
              background: category === value ? "#f0f5ff" : "#fff",
              border: `1px solid ${category === value ? "#3182ce" : "#eaeaea"}`,
              color: category === value ? "#2b6cb0" : "#555",
              fontWeight: category === value ? "600" : "500",
              borderRadius: "30px",
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {value === "all" ? "Tất cả" : value}
          </button>
        ))}
      </div>

      {/* Thanh thông tin kết quả + nhóm nút sắp xếp */}
      <div
        className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-4 p-3"
        style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f0f0f0" }}
      >
        {/* Số sản phẩm tìm được */}
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

      {/* Grid sản phẩm — responsive: 1/2/3/4 cột tuỳ màn hình */}
      <div className="row g-4">
        {pageItems.length > 0 ? (
          pageItems.map((product) => (
            <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <ProductCard product={product} />
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
          <button className="btn btn-outline-secondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage === 1} style={{ borderRadius: "8px" }}>Trước</button>
          <div className="mx-3" style={{ fontWeight: 600 }}>
            Trang <span style={{ color: "#f76c85" }}>{safePage}</span> / {totalPages}
          </div>
          <button className="btn btn-outline-secondary" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={safePage === totalPages} style={{ borderRadius: "8px" }}>Tiếp</button>
          <button className="btn btn-outline-secondary" onClick={() => setPage(totalPages)} disabled={safePage === totalPages} style={{ borderRadius: "8px" }}>Cuối</button>
        </div>
      )}
    </div>
  );
}