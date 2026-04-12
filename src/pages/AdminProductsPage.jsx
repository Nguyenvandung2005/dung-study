import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../components/CartContext";
import useFetch from "../hooks/useFetch";
import {
  createProductApi,
  deleteProductApi,
  updateProductApi,
} from "../services/productService";

// Form mặc định dùng cho cả tạo mới và chỉnh sửa sản phẩm.
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
  const { currentUser, authLoading } = useCart();

  // Dùng hook useFetch để lấy danh sách sản phẩm từ backend.
  const { data, loading: fetchLoading, error: fetchError } = useFetch("/api/products");

  // State cục bộ để cập nhật UI ngay sau khi tạo/sửa/xóa mà không cần tải lại trang.
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const productsData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  // Đồng bộ dữ liệu từ hook sang state hiển thị khi fetch thành công.
  useEffect(() => {
    setProducts(productsData);
  }, [productsData]);

  // Đồng bộ lỗi fetch để hiển thị cùng vùng thông báo của trang.
  useEffect(() => {
    setError(fetchError || "");
  }, [fetchError]);

  if (authLoading) {
    return <div className="container py-5 text-center">Đang kiểm tra quyền truy cập...</div>;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return <div className="container py-5 text-center text-danger">Bạn không có quyền truy cập khu vực quản trị.</div>;
  }

  // Reset form về trạng thái tạo mới.
  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setImagePreview("");
  };

  // Xử lý thay đổi các ô nhập thông tin sản phẩm.
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "image") {
      setImagePreview(value);
    }
  };

  // Đọc file ảnh tại frontend để preview và gửi lên backend dưới dạng data URL.
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

  // Nạp dữ liệu sản phẩm cũ vào form để admin chỉnh sửa.
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

  // Tạo mới hoặc cập nhật sản phẩm tùy theo trạng thái đang sửa hay không.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      price: Number(form.price || 0),
      discount: Number(form.discount || 0),
      currency: "VND",
    };

    try {
      if (editingId) {
        const updated = await updateProductApi(editingId, payload);
        setProducts((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const created = await createProductApi(payload);
        setProducts((prev) => [created, ...prev]);
      }

      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Xóa sản phẩm khỏi hệ thống sau khi admin xác nhận.
  const handleDelete = async (id) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;

    try {
      await deleteProductApi(id);
      setProducts((prev) => prev.filter((item) => item.id !== id));

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Quản lý sản phẩm</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-4 mb-4">
        <h5 className="mb-3">{editingId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h5>

        <div className="row g-3">
          {["id", "name", "brand", "category", "price", "discount", "origin"].map((field) => (
            <div key={field} className="col-md-6">
              <input
                className="form-control"
                name={field}
                placeholder={field}
                value={form[field]}
                onChange={handleChange}
                disabled={editingId && field === "id"}
              />
            </div>
          ))}

          <div className="col-12">
            <label className="form-label fw-semibold">Ảnh sản phẩm</label>
            <div className="row g-3 align-items-start">
              <div className="col-md-6">
                <input
                  className="form-control"
                  name="image"
                  placeholder="URL ảnh hoặc data URL"
                  value={form.image}
                  onChange={handleChange}
                />
                <div className="form-text">Có thể dán URL ảnh hoặc chọn file bên cạnh.</div>
              </div>
              <div className="col-md-6">
                <input className="form-control" type="file" accept="image/*" onChange={handleImageFile} />
                <div className="form-text">Ảnh sẽ được đọc trực tiếp và lưu cùng dữ liệu sản phẩm.</div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="border rounded p-3 bg-light">
              <div className="fw-semibold mb-2">Xem trước ảnh</div>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: 220, maxHeight: 220, objectFit: "contain", display: "block" }}
                />
              ) : (
                <div className="text-muted">Chưa có ảnh được chọn.</div>
              )}
            </div>
          </div>

          <div className="col-12">
            <textarea className="form-control" rows="3" name="description" placeholder="Mô tả" value={form.description} onChange={handleChange} />
          </div>
          <div className="col-12">
            <textarea className="form-control" rows="3" name="ingredients" placeholder="Thành phần" value={form.ingredients} onChange={handleChange} />
          </div>
          <div className="col-12">
            <textarea className="form-control" rows="3" name="usage" placeholder="Hướng dẫn sử dụng" value={form.usage} onChange={handleChange} />
          </div>
        </div>

        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-danger" type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mới"}
          </button>
          {editingId && (
            <button className="btn btn-outline-secondary" type="button" onClick={resetForm}>
              Hủy sửa
            </button>
          )}
        </div>
      </form>

      <div className="card p-4">
        <h5 className="mb-3">Danh sách sản phẩm</h5>
        {fetchLoading ? (
          <div>Đang tải...</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ảnh</th>
                  <th>Tên</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8, border: "1px solid #eee", background: "#fff" }}
                        />
                      ) : (
                        <span className="text-muted">Không ảnh</span>
                      )}
                    </td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{Number(product.price || 0).toLocaleString("vi-VN")}₫</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(product)}>Sửa</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(product.id)}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
