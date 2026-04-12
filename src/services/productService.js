import { apiFetch, createHeaders } from "./http";

// Tạo sản phẩm mới, chỉ dùng cho admin.
export function createProductApi(payload) {
  return apiFetch("/api/products", {
    method: "POST",
    headers: createHeaders(true),
    body: JSON.stringify(payload),
  });
}

// Cập nhật thông tin sản phẩm theo id, chỉ dùng cho admin.
export function updateProductApi(id, payload) {
  return apiFetch(`/api/products/${id}`, {
    method: "PUT",
    headers: createHeaders(true),
    body: JSON.stringify(payload),
  });
}

// Xóa sản phẩm khỏi hệ thống, chỉ dùng cho admin.
export function deleteProductApi(id) {
  return apiFetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: createHeaders(true),
  });
}
