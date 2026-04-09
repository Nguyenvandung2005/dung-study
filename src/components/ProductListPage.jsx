import React, { useEffect, useMemo, useState } from "react";
import productsData from "../data/products";

function formatVnd(value) {
  return `${value.toLocaleString("vi-VN")}₫`;
}

function ProductCard({ product }) {
  return (
    <div
      className="card h-100"
      style={{ borderRadius: 12, overflow: "hidden" }}
      title={product.name}
    >
      <div
        style={{
          background: "#fff",
          padding: 12,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <img
          src={product.image}
          alt={product.name}
          style={{ width: 160, height: 160, objectFit: "contain" }}
        />
      </div>

      <div className="card-body d-flex flex-column">
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
          {product.brand} • {product.category}
        </div>

        <div className="card-title" style={{ fontWeight: 600, lineHeight: 1.25 }}>
          {product.name}
        </div>

        <div style={{ marginTop: 10, fontWeight: 800, color: "#f76c85" }}>
          {formatVnd(product.price)}
        </div>

        <button
          type="button"
          className="btn mt-auto"
          style={{ background: "#f76c85", color: "white", marginTop: 12 }}
          onClick={() => alert(`(Tạm) Thêm vào giỏ: ${product.name}`)}
        >
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );
}

export default function ProductListPage({ query = "" }) {
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

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

      const matchCategory = category === "all" || p.category === category;

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
