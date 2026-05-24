import React, { useState } from "react";
import { useCart } from "../components/CartContext";
import useProductsData from "../hooks/useProductsData";

// Object mặc định cho form thêm/sửa sản phẩm
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
  // Lấy thông tin tài khoản hiện tại để kiểm tra quyền admin
  const { currentUser, authLoading } = useCart();
  // Lấy danh sách sản phẩm, trạng thái tải và hàm cập nhật danh sách
  const { products, setProducts, loading, error: seedError } = useProductsData();

  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  if (authLoading || loading) {
    return <div className="container py-5 text-center">Đang tải dữ liệu sản phẩm...</div>;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return <div className="container py-5 text-center text-danger">Bạn không có quyền truy cập khu vực quản trị.</div>;
  }

  // Reset form về trạng thái mặc định sau khi lưu hoặc khi hủy sửa
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setImagePreview("");
  };

  // Xử lý khi thay đổi giá trị các input/textarea
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Nếu đang nhập URL ảnh thì cập nhật preview ngay
    if (name === "image") {
      setImagePreview(value);
    }
  };

  // Xử lý upload file ảnh và chuyển sang Data URL (base64)
  const handleImageFile = (event) => {
    // Lấy file đầu tiên từ input file
    const file = event.target.files?.[0];
    if (!file) return;

    // Dùng FileReader để đọc ảnh thành chuỗi base64
    const reader = new FileReader();
    reader.onload = () => {
      // Khi đọc xong: cập nhật ảnh vào form và preview
      const result = String(reader.result || "");
      setForm((prev) => ({ ...prev, image: result }));
      setImagePreview(result);
    };
    // Bắt đầu đọc file dưới dạng Data URL
    reader.readAsDataURL(file);
  };

  // Đưa dữ liệu sản phẩm lên form để chỉnh sửa
  const handleEdit = (product) => {
    // Lưu id đang sửa để chuyển form sang chế độ update
    setEditingId(product.id);
    // Nạp dữ liệu sản phẩm cũ vào form
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
    // Đồng bộ ảnh preview theo sản phẩm đang sửa
    setImagePreview(product.image || "");
  };

  // Xử lý submit cho cả tạo mới và cập nhật sản phẩm
  const handleSubmit = (event) => {
    // Chặn reload trang mặc định
    event.preventDefault();
    // Bật cờ lưu và xóa lỗi cũ
    setSaving(true);
    setError("");

    // Chuẩn hóa dữ liệu trước khi ghi vào state products
    const payload = {
      ...form,
      id: form.id || `pc-${Date.now()}`,
      price: Number(form.price || 0),
      discount: Number(form.discount || 0),
      currency: "VND",
    };

    // Validate các trường bắt buộc
    if (!payload.name || !payload.brand || !payload.category) {
      setSaving(false);
      setError("Vui lòng nhập đầy đủ tên, thương hiệu và danh mục.");
      return;
    }

    // Cập nhật danh sách sản phẩm theo ngữ cảnh sửa/thêm
    setProducts((prevProducts) => {
      if (editingId) {
        return prevProducts.map((item) => (item.id === editingId ? payload : item));
        //Trả về danh sách mới với item đã được cập nhật
      }

      // Trường hợp thêm mới nhưng id đã tồn tại
      if (prevProducts.some((item) => item.id === payload.id)) {
        setError("ID sản phẩm đã tồn tại.");
        setSaving(false);
        return prevProducts;
      }

      // Trường hợp thêm mới thành công: thêm vào đầu danh sách
      return [payload, ...prevProducts];
    });

    // Hoàn tất lưu: reset form và tắt trạng thái saving
    resetForm();
    setSaving(false);
  };

  // Xóa sản phẩm khỏi danh sách
  const handleDelete = (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) return;

    setProducts((prevProducts) => prevProducts.filter((item) => item.id !== id));

    // Nếu đang sửa đúng sản phẩm vừa xóa thì reset form
    if (editingId === id) {
      resetForm();
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Quản lý sản phẩm</h2>

      {/* Hiển thị lỗi từ form hoặc lỗi lấy dữ liệu seed */}
      {(error || seedError) && <div className="alert alert-danger">{error || seedError}</div>}

      {/* Khối form thêm mới / cập nhật */}
      <form onSubmit={handleSubmit} className="card p-4 mb-4 shadow-sm">
        {/* Đổi tiêu đề theo chế độ thêm mới hay chỉnh sửa */}
        <h5 className="mb-3">{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h5>

        <div className="row g-3">
          {/* Render động nhóm input cơ bản để tránh lặp code */}
          {[
            { key: "id", label: "Mã sản phẩm (ID)" },
            { key: "name", label: "Tên sản phẩm" },
            { key: "brand", label: "Thương hiệu" },
            { key: "category", label: "Danh mục" },
            { key: "price", label: "Giá bán" },
            { key: "discount", label: "Giảm giá (%)" },
            { key: "origin", label: "Xuất xứ" },
          ].map((field) => (
            <div key={field.key} className="col-md-6">
              <label className="form-label small fw-bold">{field.label}</label>
              <input
                className="form-control"
                name={field.key}
                placeholder={`Nhập ${field.label.toLowerCase()}...`}
                value={form[field.key]}
                onChange={handleChange}
                // Khi sửa thì khóa input ID để tránh đổi khóa chính
                disabled={editingId && field.key === "id"}
              />
            </div>
          ))}

          {/* Nhập ảnh bằng URL hoặc upload file */}
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

          {/* Khung xem trước ảnh */}
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

          {/* Các ô nhập nội dung dài */}
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

        {/* Nút thao tác form */}
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

      {/* Khối bảng danh sách sản phẩm */}
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
                    {/* Nút đẩy dữ liệu sản phẩm vào form để sửa */}
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(product)}>Sửa</button>
                    {/* Nút xóa sản phẩm khỏi danh sách */}
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
