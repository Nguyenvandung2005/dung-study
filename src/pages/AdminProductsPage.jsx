import React, { useState } from "react";
import { useCart } from "../components/CartContext";
import useProductsData from "../hooks/useProductsData";

// Khởi tạo giá trị mặc định cho Form
const emptyForm = {
  id: "",
  name: "",
  brand: "",
  category: "",
  image: "",
  price: "",
  discount: "",
  origin: "",
  description: "",
  ingredients: "",
  usage: "",
};

export default function AdminProductsPage() {
  // 1. Lấy dữ liệu từ Context và Hook tùy chỉnh
  const { currentUser, authLoading } = useCart();
  const { products, setProducts, loading, error: seedError } = useProductsData();

  // 2. Quản lý State cho giao diện
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(""); // Lưu ID sản phẩm đang được sửa
  const [form, setForm] = useState(emptyForm);    // Dữ liệu trong các ô nhập
  const [saving, setSaving] = useState(false);    // Trạng thái khi đang lưu
  const [imagePreview, setImagePreview] = useState(""); // Hiển thị ảnh xem trước

  // 3. Kiểm tra trạng thái tải dữ liệu
  if (authLoading || loading) {
    return <div className="container py-5 text-center">Đang tải dữ liệu sản phẩm...</div>;
  }

  // 4. Kiểm tra phân quyền Admin (Bảo mật cơ bản)
  if (!currentUser || currentUser.role !== "admin") {
    return <div className="container py-5 text-center text-danger">Bạn không có quyền truy cập khu vực quản trị.</div>;
  }

  // Hàm reset form về trạng thái trống
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setImagePreview("");
  };

  // Xử lý thay đổi dữ liệu trong các ô input văn bản
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Nếu người dùng dán URL ảnh trực tiếp vào ô input
    if (name === "image") {
      setImagePreview(value);
    }
  };

  // Xử lý chọn file ảnh từ máy tính và chuyển sang dạng Base64
  const handleImageFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setForm((prev) => ({ ...prev, image: result }));
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  // Đưa dữ liệu của sản phẩm cũ vào form để bắt đầu chỉnh sửa
  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      id: product.id,
      name: product.name || "",
      brand: product.brand || "",
      category: product.category || "",
      image: product.image || "",
      price: product.price || "",
      discount: product.discount || "",
      origin: product.origin || "",
      description: product.description || "",
      ingredients: product.ingredients || "",
      usage: product.usage || "",
    });
    setImagePreview(product.image || "");
  };

  // Xử lý khi bấm nút "Tạo mới" hoặc "Cập nhật"
  const handleSubmit = (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    // Chuẩn bị dữ liệu gửi đi (ép kiểu số cho giá và giảm giá)
    const payload = {
      ...form,
      id: form.id || `pc-${Date.now()}`,
      price: Number(form.price || 0),
      discount: Number(form.discount || 0),
      currency: "VND",
    };

    // Kiểm tra các trường bắt buộc
    if (!payload.name || !payload.brand || !payload.category) {
      setSaving(false);
      setError("Vui lòng nhập đầy đủ tên, thương hiệu và danh mục.");
      return;
    }

    setProducts((prevProducts) => {
      // Trường hợp 1: Đang sửa sản phẩm cũ
      if (editingId) {
        return prevProducts.map((item) => (item.id === editingId ? payload : item));
      }

      // Trường hợp 2: Thêm mới nhưng trùng ID
      if (prevProducts.some((item) => item.id === payload.id)) {
        setError("ID sản phẩm đã tồn tại.");
        setSaving(false);
        return prevProducts;
      }

      // Trường hợp 3: Thêm mới thành công vào đầu danh sách
      return [payload, ...prevProducts];
    });

    resetForm();
    setSaving(false);
  };

  // Xử lý xóa sản phẩm
  const handleDelete = (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return;

    setProducts((prevProducts) => prevProducts.filter((item) => item.id !== id));

    // Nếu đang sửa sản phẩm đó mà bấm xóa luôn thì reset form
    if (editingId === id) {
      resetForm();
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Quản lý sản phẩm</h2>

      {/* Hiển thị thông báo lỗi nếu có */}
      {(error || seedError) && <div className="alert alert-danger">{error || seedError}</div>}

      {/* KHỐI 1: FORM NHẬP LIỆU */}
      <form onSubmit={handleSubmit} className="card p-4 mb-4 shadow-sm">
        <h5 className="mb-3">{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h5>

        <div className="row g-3">
          {/* Tự động tạo các ô input cơ bản */}
          {[
            { key: "id", label: "Mã sản phẩm (ID)" },
            { key: "name", label: "Tên sản phẩm" },
            { key: "brand", label: "Thương hiệu" },
            { key: "category", label: "Danh mục" },
            { key: "price", label: "Giá bán" },
            { key: "discount", label: "Giảm giá (%)" },
            { key: "origin", label: "Xuất xứ" }
          ].map((field) => (
            <div key={field.key} className="col-md-6">
              <label className="form-label small fw-bold">{field.label}</label>
              <input
                className="form-control"
                name={field.key}
                placeholder={`Nhập ${field.label.toLowerCase()}...`}
                value={form[field.key]}
                onChange={handleChange}
                disabled={editingId && field.key === "id"} // Không cho sửa ID khi đang cập nhật
              />
            </div>
          ))}

          {/* Chọn ảnh sản phẩm */}
          <div className="col-12">
            <label className="form-label fw-bold">Ảnh sản phẩm</label>
            <div className="row g-3 align-items-start">
              <div className="col-md-6">
                <input
                  className="form-control"
                  name="image"
                  placeholder="Dán URL ảnh vào đây..."
                  value={form.image}
                  onChange={handleChange}
                />
                <div className="form-text">Bạn có thể dán URL ảnh hoặc chọn file bên cạnh.</div>
              </div>
              <div className="col-md-6">
                <input className="form-control" type="file" accept="image/*" onChange={handleImageFile} />
                <div className="form-text">Ảnh sẽ được lưu trực tiếp vào dữ liệu sản phẩm.</div>
              </div>
            </div>
          </div>

          {/* Khu vực xem trước ảnh */}
          <div className="col-12">
            <div className="border rounded p-3 bg-light text-center">
              <div className="fw-bold mb-2">Xem trước ảnh</div>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: 200, maxHeight: 200, objectFit: "contain", margin: "0 auto" }}
                />
              ) : (
                <div className="text-muted italic">Chưa có ảnh nào được chọn.</div>
              )}
            </div>
          </div>

          {/* Các ô nhập liệu dài */}
          <div className="col-12">
            <label className="form-label fw-bold">Mô tả sản phẩm</label>
            <textarea className="form-control" rows="3" name="description" placeholder="Mô tả chi tiết..." value={form.description} onChange={handleChange} />
          </div>
          <div className="col-12">
            <label className="form-label fw-bold">Thành phần</label>
            <textarea className="form-control" rows="3" name="ingredients" placeholder="Danh sách thành phần..." value={form.ingredients} onChange={handleChange} />
          </div>
          <div className="col-12">
            <label className="form-label fw-bold">Hướng dẫn sử dụng</label>
            <textarea className="form-control" rows="3" name="usage" placeholder="Cách dùng sản phẩm..." value={form.usage} onChange={handleChange} />
          </div>
        </div>

        {/* Nút điều hướng form */}
        <div className="d-flex gap-2 mt-4">
          <button className="btn btn-danger px-4" type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : editingId ? "Cập nhật sản phẩm" : "Tạo sản phẩm mới"}
          </button>
          {editingId && (
            <button className="btn btn-outline-secondary" type="button" onClick={resetForm}>
              Hủy sửa
            </button>
          )}
        </div>
      </form>

      {/* KHỐI 2: BẢNG DANH SÁCH SẢN PHẨM */}
      <div className="card p-4 shadow-sm">
        <h5 className="mb-3">Danh sách sản phẩm hiện có</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Hình ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá niêm yết</th>
                <th className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td><small className="text-muted">{product.id}</small></td>
                  <td>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{ width: 50, height: 50, objectFit: "contain", borderRadius: 4, background: "#fff", border: "1px solid #ddd" }}
                      />
                    ) : (
                      <span className="text-muted small">Không ảnh</span>
                    )}
                  </td>
                  <td className="fw-bold">{product.name}</td>
                  <td><span className="badge bg-info text-dark">{product.category}</span></td>
                  <td>{Number(product.price || 0).toLocaleString("vi-VN")}đ</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(product)}>Sửa</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(product.id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}