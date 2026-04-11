import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import useFetch from "../hooks/useFetch";

export default function ProductListPage({ query = "" }) {
    const { data: productsData, loading, error } = useFetch("http://localhost:3000/products");

    // --- 1. STATE & URL PARAMS ---
    const [searchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get("category");
    const [category, setCategory] = useState(categoryFromUrl || "all");

    // State cho tính năng Sắp xếp (Mặc định là 'popular' - Phổ biến)
    const [sortBy, setSortBy] = useState("popular");

    const [page, setPage] = useState(1);
    const itemsPerPage = 12;

    // --- 2. EFFECTS ---
    useEffect(() => {
        if (categoryFromUrl) setCategory(categoryFromUrl);
        else setCategory("all");
    }, [categoryFromUrl]);

    // Reset về trang 1 khi đổi bộ lọc hoặc đổi kiểu sắp xếp
    useEffect(() => {
        setPage(1);
    }, [category, query, sortBy]);

    // --- 3. LẤY DANH MỤC ---
    const categories = useMemo(() => {
        if (!productsData) return ["all"];
        const set = new Set(productsData.map((p) => p.category));
        return ["all", ...Array.from(set)];
    }, [productsData]);

    const normalizedQuery = query.trim().toLowerCase();

    // --- 4. LOGIC LỌC VÀ SẮP XẾP TỔNG HỢP ---
    const filteredAndSorted = useMemo(() => {
        if (!productsData) return [];

        // Bước 1: Lọc theo Tên/Thương hiệu và Danh mục
        let result = productsData.filter((p) => {
            const matchQuery =
                !normalizedQuery ||
                p.name.toLowerCase().includes(normalizedQuery) ||
                p.brand.toLowerCase().includes(normalizedQuery);

            const matchCategory =
                category === "all" ||
                p.category.toLowerCase() === category.toLowerCase();

            return matchQuery && matchCategory;
        });

        // Bước 2: Sắp xếp kết quả
        switch (sortBy) {
            case "price-asc":
                result.sort((a, b) => a.price - b.price); // Giá: Thấp đến Cao
                break;
            case "price-desc":
                result.sort((a, b) => b.price - a.price); // Giá: Cao đến Thấp
                break;
            case "hot":
                // CẬP NHẬT MỚI: Sắp xếp theo phần trăm giảm giá (discount) từ Cao xuống Thấp
                // Nếu sản phẩm không có trường discount, mặc định coi như là 0
                result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
                break;
            case "popular":
            default:
                // Sắp xếp mặc định
                break;
        }

        return result;
    }, [productsData, category, normalizedQuery, sortBy]);

    // --- 5. PHÂN TRANG ---
    const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / itemsPerPage));
    const safePage = Math.min(page, totalPages);

    const pageItems = useMemo(() => {
        const start = (safePage - 1) * itemsPerPage;
        return filteredAndSorted.slice(start, start + itemsPerPage);
    }, [filteredAndSorted, safePage]);

    // --- 6. RENDER GIAO DIỆN CHỜ/LỖI ---
    if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-danger" role="status"></div></div>;
    if (error) return <div className="container py-5 text-center text-danger"><h4>Lỗi: {error}</h4></div>;

    // --- HÀM HỖ TRỢ STYLE CHO NÚT SẮP XẾP ---
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
        whiteSpace: "nowrap"
    });

    return (
        <div className="container-fluid" style={{ marginTop: 24, marginBottom: 80, padding: "0 5%" }}>

            {/* BREADCRUMB */}
            <div className="mb-3">
                <nav style={{ fontSize: "0.9rem" }}>
                    <Link to="/" style={{ textDecoration: "none", color: "#6c757d" }}>Trang chủ</Link>
                    <span style={{ margin: "0 8px", color: "#6c757d" }}>&gt;</span>
                    <span style={{ color: "#333", fontWeight: 600 }}>Bộ Sưu Tập</span>
                </nav>
            </div>

            {/* THANH DANH MỤC */}
            <div className="d-flex flex-nowrap overflow-auto mb-4 pb-2" style={{ gap: "12px", WebkitOverflowScrolling: "touch" }}>
                {categories.map((c) => (
                    <button
                        key={c}
                        onClick={() => setCategory(c)}
                        style={{
                            padding: "8px 24px",
                            background: category === c ? "#f76c85" : "#fff",
                            border: "1px solid " + (category === c ? "#f76c85" : "#eaeaea"),
                            color: category === c ? "#fff" : "#555",
                            fontWeight: category === c ? "600" : "500",
                            borderRadius: "30px",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            transition: "all 0.3s ease"
                        }}
                    >
                        {c === "all" ? "Tất cả" : c}
                    </button>
                ))}
            </div>

            {/* KHỐI SẮP XẾP THEO (Sort Bar) */}
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center mb-4 p-3" style={{ background: "#fff", borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                <div style={{ opacity: 0.8, fontSize: "0.95rem", marginBottom: "12px", display: "flex", alignItems: "center" }}>
                    Tìm thấy <b className="mx-1">{filteredAndSorted.length}</b> sản phẩm phù hợp
                </div>

                <div className="d-flex flex-wrap align-items-center gap-3">
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "#222" }}>Sắp xếp theo</span>

                    <button onClick={() => setSortBy("popular")} style={getSortBtnStyle(sortBy === "popular")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        Phổ biến
                    </button>

                    <button onClick={() => setSortBy("hot")} style={getSortBtnStyle(sortBy === "hot")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="2"></circle><circle cx="15" cy="15" r="2"></circle><line x1="21" y1="3" x2="3" y2="21"></line></svg>
                        Khuyến mãi HOT
                    </button>

                    <button onClick={() => setSortBy("price-asc")} style={getSortBtnStyle(sortBy === "price-asc")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="13" y2="6"></line><line x1="4" y1="12" x2="11" y2="12"></line><line x1="4" y1="18" x2="11" y2="18"></line><polyline points="15 10 18 6 21 10"></polyline><line x1="18" y1="6" x2="18" y2="18"></line></svg>
                        Giá Thấp - Cao
                    </button>

                    <button onClick={() => setSortBy("price-desc")} style={getSortBtnStyle(sortBy === "price-desc")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="11" y2="6"></line><line x1="4" y1="12" x2="11" y2="12"></line><line x1="4" y1="18" x2="13" y2="18"></line><polyline points="15 14 18 18 21 14"></polyline><line x1="18" y1="6" x2="18" y2="18"></line></svg>
                        Giá Cao - Thấp
                    </button>
                </div>
            </div>

            {/* GRID SẢN PHẨM */}
            <div className="row g-4">
                {pageItems.length > 0 ? (
                    pageItems.map((p) => (
                        <div key={p.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                            <ProductCard product={p} />
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <div style={{ fontSize: "50px" }}>🔍</div>
                        <h4 className="text-muted mt-3">Rất tiếc, chúng tôi không tìm thấy sản phẩm nào!</h4>
                        <p className="text-secondary">Hãy thử tìm kiếm với từ khóa khác hoặc đổi danh mục.</p>
                    </div>
                )}
            </div>

            {/* PHÂN TRANG */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center gap-2 mt-5">
                    <button className="btn btn-outline-secondary" onClick={() => setPage(1)} disabled={safePage === 1} style={{ borderRadius: "8px" }}>Đầu</button>
                    <button className="btn btn-outline-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} style={{ borderRadius: "8px" }}>Trước</button>
                    <div className="mx-3" style={{ fontWeight: 600 }}>Trang <span style={{ color: "#f76c85" }}>{safePage}</span> / {totalPages}</div>
                    <button className="btn btn-outline-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ borderRadius: "8px" }}>Tiếp</button>
                    <button className="btn btn-outline-secondary" onClick={() => setPage(totalPages)} disabled={safePage === totalPages} style={{ borderRadius: "8px" }}>Cuối</button>
                </div>
            )}
        </div>
    );
}