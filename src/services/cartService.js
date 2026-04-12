import { apiFetch, createHeaders } from "./http";

// Lấy giỏ hàng đã lưu trên server của user hiện tại.
export function getCartApi() {
  return apiFetch("/api/cart", {
    headers: createHeaders(true),
  });
}

// Đồng bộ toàn bộ giỏ hàng hiện tại từ frontend lên backend.
export function saveCartApi(items) {
  return apiFetch("/api/cart", {
    method: "PUT",
    headers: createHeaders(true),
    body: JSON.stringify({ items }),
  });
}
