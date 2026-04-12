import { apiFetch, createHeaders } from "./http";

// Gửi thông tin đăng nhập để lấy token và user hiện tại.
export function loginApi(contact, password) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify({ contact, password }),
  });
}

// Tạo tài khoản mới trên backend.
export function registerApi(payload) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify(payload),
  });
}

// Kiểm tra email hoặc số điện thoại đã tồn tại hay chưa.
export function checkContactApi(contact) {
  return apiFetch("/api/auth/check-contact", {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify({ contact }),
  });
}

// Lấy thông tin của user đang đăng nhập từ token hiện tại.
export function meApi() {
  return apiFetch("/api/auth/me", {
    headers: createHeaders(true),
  });
}
