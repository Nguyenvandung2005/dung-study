import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import productsData from "../data/products";
import ProductCard from "./ProductCard";

export default function ProductListPage({ query = "" }) {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const [category, setCategory] = useState(categoryFromUrl || "all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    setCategory(categoryFromUrl || "all");
  }, [categoryFromUrl]);

  const categories = useMemo(() => {
    const set = new Set(productsData.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
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
  }, [category, normalizedQuery]);

  useEffect(() => {
    setPage(1);
  }, [category, normalizedQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, safePage]);

  return (
    <div className="container-fluid" style={{ marginTop: 24, padding: "0 50px" }}>
      <div className="d-flex align-items-end justify-content-between flex-wrap gap-3">
        <div>
          <nav style={{ marginBottom: 10, fontSize: 14 }}>
            <Link to="/" style={{ textDecoration: "none", color: "#8b8b8b" }}>
              Trang chủ
            </Link>
            <span style={{ margin: "0 8px", color: "#8b8b8b" }}>/</span>
            <span style={{ fontWeight: 600 }}>Bộ sưu tập</span>
          </nav>
          <h2 style={{ margin: 0 }}>Danh sách sản phẩm</h2>
          <div style={{ opacity: 0.8 }}>
            Tổng: <b>{filtered.length}</b> sản phẩm • Trang <b>{safePage}</b> / <b>{totalPages}</b>
          </div>
        </div>

        <div style={{ minWidth: 220 }}>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>
            Danh mục
          </label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "Tất cả" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr style={{ margin: "18px 0" }} />

      <div className="row g-3">
        {pageItems.map((p) => (
          <div key={p.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      <div
        className="d-flex justify-content-center align-items-center gap-2"
        style={{ marginTop: 18 }}
      >
        <button
          className="btn btn-outline-secondary"
          onClick={() => setPage(1)}
          disabled={safePage === 1}
        >
          First
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safePage === 1}
        >
          Prev
        </button>

        <span style={{ padding: "0 8px" }}>
          Page <b>{safePage}</b> / <b>{totalPages}</b>
        </span>

        <button
          className="btn btn-outline-secondary"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage === totalPages}
        >
          Next
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => setPage(totalPages)}
          disabled={safePage === totalPages}
        >
          Last
        </button>
      </div>
    </div>
  );
}
