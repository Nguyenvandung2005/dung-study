import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom"; // --- THÊM MỚI: Import useSearchParams ---
import ProductCard from "../components/ProductCard";
import useFetch from "../hooks/useFetch";

export default function ProductListPage({ query = "" }) {
    // 1. Lấy dữ liệu từ hook useFetch
    const { data: productsData, loading, error } = useFetch("http://localhost:3000/products");

    // --- THÊM MỚI BẮT ĐẦU ---
    // 2. Đọc giá trị category từ thanh địa chỉ (URL)
    const [searchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get("category"); // Lấy chữ sau dấu ?category=

    // 3. Cập nhật giá trị khởi tạo của state 'category'
    // Nếu trên URL có category (VD: Tẩy Trang) thì dùng nó, nếu không có thì mặc định là "all"
    const [category, setCategory] = useState(categoryFromUrl || "all");

    // 4. Lắng nghe sự thay đổi của URL
    // Đoạn này giúp giao diện tự động đổi tab lọc ngay lập tức khi bạn đang đứng ở trang Bộ Sưu Tập mà bấm chọn danh mục khác trên Header.
    useEffect(() => {
        if (categoryFromUrl) {
            setCategory(categoryFromUrl);
        } else {
            setCategory("all");
        }
    }, [categoryFromUrl]);
    // --- THÊM MỚI KẾT THÚC ---

    const [page, setPage] = useState(1);
    const itemsPerPage = 12;

    // Lấy danh sách các danh mục không trùng lặp
    const categories = useMemo(() => {
        if (!productsData) return ["all"];
        const set = new Set(productsData.map((p) => p.category));
        return ["all", ...Array.from(set)];
    }, [productsData]);

    const normalizedQuery = query.trim().toLowerCase();

    // Lọc sản phẩm theo tìm kiếm và danh mục
    const filtered = useMemo(() => {
        if (!productsData) return [];
        return productsData.filter((p) => {
            const matchQuery =
                !normalizedQuery ||
                p.name.toLowerCase().includes(normalizedQuery) ||
                p.brand.toLowerCase().includes(normalizedQuery);

            const matchCategory =
                category === "all" ||
                p.category.toLowerCase() === category.toLowerCase();

            return matchQuery && matchCategory;
        });
    }, [productsData, category, normalizedQuery]);

    // Reset page về 1 khi đổi filter/search
    useEffect(() => {
        setPage(1);
    }, [category, normalizedQuery]);

    // Tính toán phân trang
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const safePage = Math.min(page, totalPages);

    const pageItems = useMemo(() => {
        const start = (safePage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, safePage]);

    // Xử lý giao diện chờ tải hoặc lỗi
    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-danger" role="status"></div>
                <h4 className="mt-3" style={{ color: "#f76c85" }}>Đang tải bộ sưu tập...</h4>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-5 text-center text-danger">
                <h4>Đã có lỗi xảy ra: {error}</h4>
                <button className="btn btn-outline-danger mt-3" onClick={() => window.location.reload()}>
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="container-fluid" style={{ marginTop: 24, marginBottom: 80, padding: "0 5%" }}>

            {/* BREADCRUMB & TIÊU ĐỀ */}
            <div className="d-flex align-items-end justify-content-between mb-4">
                <div>
                    <nav style={{ marginBottom: 12, fontSize: "0.9rem" }}>
                        <Link to="/" style={{ textDecoration: "none", color: "#6c757d" }}>Trang chủ</Link>
                        <span style={{ margin: "0 8px", color: "#6c757d" }}>&gt;</span>
                        <span style={{ color: "#333", fontWeight: 600 }}>Bộ Sưu Tập</span>
                    </nav>

                    <div style={{ opacity: 0.7, fontSize: "0.95rem", marginTop: 4 }}>
                        Tìm thấy <b>{filtered.length}</b> sản phẩm phù hợp
                    </div>
                </div>
            </div>

            {/* THANH DANH MỤC (TABS) */}
            <div
                className="d-flex flex-nowrap overflow-auto mb-4 pb-2"
                style={{ gap: "12px", WebkitOverflowScrolling: "touch", borderBottom: "1px solid #f0f0f0" }}
            >
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
                            transition: "all 0.3s ease",
                            boxShadow: category === c ? "0 4px 10px rgba(247, 108, 133, 0.3)" : "none"
                        }}
                    >
                        {c === "all" ? "Tất cả" : c}
                    </button>
                ))}
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
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setPage(1)}
                        disabled={safePage === 1}
                        style={{ borderRadius: "8px" }}
                    >
                        Đầu
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        style={{ borderRadius: "8px" }}
                    >
                        Trước
                    </button>

                    <div className="mx-3" style={{ fontWeight: 600 }}>
                        Trang <span style={{ color: "#f76c85" }}>{safePage}</span> / {totalPages}
                    </div>

                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        style={{ borderRadius: "8px" }}
                    >
                        Tiếp
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setPage(totalPages)}
                        disabled={safePage === totalPages}
                        style={{ borderRadius: "8px" }}
                    >
                        Cuối
                    </button>
                </div>
            )}
        </div>
    );
}