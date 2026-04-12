import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useCart } from "../components/CartContext";
import useFetch from "../hooks/useFetch";

//Format số tiền sang định dạng VNĐ 
function formatVnd(value) {
  return `${value.toLocaleString("vi-VN")}₫`;
}

//  Danh sách tab thông tin sản phẩm 
const TABS = [
  { key: "spec", label: "Thông số" },
  { key: "ingredients", label: "Thành phần" },
  { key: "usage", label: "Hướng dẫn dùng" },
];

export default function ProductDetailPage() {
  // Lấy id sản phẩm từ URL 
  const { id } = useParams();

  // Hàm thêm sản phẩm vào giỏ hàng từ CartContext
  const { addToCart } = useCart();

  // Fetch chi tiết sản phẩm theo id + toàn bộ sản phẩm để gợi ý
  const { data: productData, loading, error } = useFetch(`/api/products/${id}`);
  const { data: allProductsData } = useFetch("/api/products");

  //  State cục bộ
  const [quantity, setQuantity] = useState(1);       // số lượng chọn mua
  const [activeTab, setActiveTab] = useState("spec");  // tab đang mở
  const [added, setAdded] = useState(false);   // hiệu ứng "đã thêm vào giỏ"
  const [wished, setWished] = useState(false);   // trạng thái yêu thích

  const product = productData || null;
  const allProducts = Array.isArray(allProductsData) ? allProductsData : [];

  //  Lọc sản phẩm cùng danh mục, loại trừ sản phẩm hiện tại, lấy tối đa 4 
  const relatedProducts = useMemo(() => {
    if (!product?.id) return [];
    return allProducts
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [allProducts, product]);

  // Tính giá gốc (trước giảm) nếu có discount 
  const discount = product?.discount || 0;
  const oldPrice = product?.oldPrice || product?.originalPrice || (
    discount > 0 && product?.price
      ? Math.round(product.price / (1 - discount / 100))
      : null
  );

  //  Xử lý thêm vào giỏ: gọi context rồi bật hiệu ứng 1.8 giây 
  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  // Trạng thái loading
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" style={{ color: "#f76c85" }} role="status" />
        <p className="mt-3" style={{ color: "#f76c85", fontWeight: 500 }}>Đang tải sản phẩm...</p>
      </div>
    );
  }

  //  Trạng thái lỗi hoặc không tìm thấy sản phẩm 
  if (error || !product?.id) {
    return (
      <div className="container text-center" style={{ marginTop: 100 }}>
        <h3 className="mb-2">Không tìm thấy sản phẩm</h3>
        <p className="text-secondary mb-4">Sản phẩm này có thể đã được xóa hoặc không tồn tại.</p>
        <Link to="/san-pham" style={{ background: "#f76c85", color: "#fff", padding: "10px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 500 }}>
          Quay lại bộ sưu tập
        </Link>
      </div>
    );
  }


  return (
    <div style={{ background: "#f6f6f4", minHeight: "100vh", paddingBottom: 80 }}>
      <div className="container" style={{ paddingTop: 28 }}>

        {/* Breadcrumb: Trang chủ / Bộ sưu tập / Tên sản phẩm */}
        <nav style={{ fontSize: 13, color: "#aaa", marginBottom: 22, display: "flex", alignItems: "center", gap: 7 }}>
          <Link to="/" style={{ color: "#aaa", textDecoration: "none" }}>Trang chủ</Link>
          <span>/</span>
          <Link to="/san-pham" style={{ color: "#aaa", textDecoration: "none" }}>Bộ sưu tập</Link>
          <span>/</span>
          <span style={{ color: "#333" }}>{product.name}</span>
        </nav>

        {/* Layout 2 cột: ảnh trái — thông tin phải */}
        <div className="row g-4 mb-4">

          {/* Cột ảnh sản phẩm */}
          <div className="col-12 col-md-5">
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: 36, display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "1 / 1", position: "relative" }}>
              {/* Badge giảm giá — chỉ hiện khi discount > 0 */}
              {discount > 0 && (
                <div style={{ position: "absolute", top: 16, right: 16, background: "#ff4d4f", color: "#fff", fontWeight: "bold", padding: "4px 12px", borderRadius: "8px", fontSize: 14, boxShadow: "0 2px 8px rgba(255, 77, 79, 0.3)" }}>
                  Giảm {discount}%
                </div>
              )}
              <img src={product.image} alt={product.name} style={{ width: "100%", maxWidth: 300, objectFit: "contain" }} />
            </div>
          </div>

          {/* Cột thông tin & hành động */}
          <div className="col-12 col-md-7">
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "28px 32px", height: "100%", display: "flex", flexDirection: "column" }}>

              {/* Tag thương hiệu + danh mục */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <span style={{ background: "#fbeaf0", color: "#c2456a", fontSize: 11, fontWeight: 600, padding: "3px 11px", borderRadius: 20, letterSpacing: ".3px" }}>{product.brand}</span>
                <span style={{ background: "#f2f2f2", color: "#777", fontSize: 11, fontWeight: 500, padding: "3px 11px", borderRadius: 20 }}>{product.category}</span>
              </div>

              {/* Tên sản phẩm */}
              <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#111", lineHeight: 1.4, marginBottom: 14 }}>{product.name}</h1>

              {/* Giá hiện tại + giá gốc gạch ngang + badge % giảm */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#f76c85" }}>{formatVnd(product.price)}</span>
                {oldPrice && discount > 0 && (
                  <span style={{ fontSize: 15, color: "#a0a0a0", textDecoration: "line-through", fontWeight: 500 }}>{formatVnd(oldPrice)}</span>
                )}
                {discount > 0 && (
                  <span style={{ background: "#fff3e0", color: "#bf5000", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: "6px" }}>-{discount}%</span>
                )}
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "0 0 18px" }} />

              {/* Mô tả ngắn sản phẩm */}
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, marginBottom: 24 }}>{product.description}</p>

              {/* Bộ chọn số lượng */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#aaa", fontWeight: 500, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".6px" }}>Số lượng</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #e8e8e8", borderRadius: 9, overflow: "hidden", width: "fit-content" }}>
                    {/* Nút giảm — disable khi đang ở 1 */}
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
                      style={{ width: 40, height: 40, background: "#fafafa", border: "none", cursor: quantity <= 1 ? "not-allowed" : "pointer", fontSize: 18, color: quantity <= 1 ? "#ccc" : "#333" }}>−</button>
                    <div style={{ width: 48, textAlign: "center", fontWeight: 700, fontSize: 15 }}>{quantity}</div>
                    {/* Nút tăng */}
                    <button onClick={() => setQuantity((q) => q + 1)}
                      style={{ width: 40, height: 40, background: "#fafafa", border: "none", cursor: "pointer", fontSize: 18, color: "#333" }}>+</button>
                  </div>
                  <span style={{ fontSize: 12, color: "#4caf50", fontWeight: 500 }}>Còn hàng</span>
                </div>
              </div>

              {/* Nút thêm giỏ hàng + nút yêu thích */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 20 }}>
                {/* Đổi màu xanh + text khi vừa thêm thành công */}
                <button onClick={handleAddToCart}
                  style={{ background: added ? "#f10755" : "#f76c85", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  {added ? "Đã thêm vào giỏ" : "Thêm vào giỏ hàng"}
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* Tab thông tin chi tiết */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", overflow: "hidden", marginBottom: 16 }}>

          {/* Thanh tab — gạch chân màu hồng khi active */}
          <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{
                  padding: "14px 24px", fontSize: 13, fontWeight: 600, background: "none", border: "none",
                  borderBottom: activeTab === key ? "2px solid #f76c85" : "2px solid transparent",
                  color: activeTab === key ? "#f76c85" : "#aaa", cursor: "pointer"
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Nội dung từng tab */}
          <div style={{ padding: "26px 32px" }}>
            {/* Tab "Thông số": hiển thị dạng bảng key-value */}
            {activeTab === "spec" && (
              <div>
                {[
                  ["Thương hiệu", product.brand],
                  ["Xuất xứ", product.origin || "Đang cập nhật"],
                  ["Danh mục", product.category],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #f6f6f4" }}>
                    <span style={{ width: 140, fontSize: 13, color: "#aaa", flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: 13, color: "#111", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Tab "Thành phần" và "Hướng dẫn dùng": hiển thị text thường */}
            {activeTab === "ingredients" && <p style={{ fontSize: 14, color: "#555", lineHeight: 1.85, margin: 0 }}>{product.ingredients}</p>}
            {activeTab === "usage" && <p style={{ fontSize: 14, color: "#555", lineHeight: 1.85, margin: 0 }}>{product.usage}</p>}
          </div>
        </div>

        {/* Sản phẩm liên quan — chỉ hiện khi có kết quả  */}
        {relatedProducts.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ebebeb", padding: "28px 32px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: "#111", letterSpacing: ".2px" }}>Có thể bạn sẽ thích</h3>
            <div className="row g-3">
              {relatedProducts.map((rp) => (
                <div key={rp.id} className="col-12 col-sm-6 col-lg-3">
                  <ProductCard product={rp} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}