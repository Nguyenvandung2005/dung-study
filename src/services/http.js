const API_BASE_URL = "http://localhost:4000";

// Header mặc định cho các request JSON từ frontend lên backend.
const API_HEADERS = {
  "Content-Type": "application/json",
};

// Ghép path tương đối thành URL API đầy đủ.
export function getApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

// Lấy token đăng nhập đã lưu trên trình duyệt.
export function getAuthToken() {
  return localStorage.getItem("authToken") || "";
}

// Tạo bộ header; nếu cần xác thực thì gắn thêm Authorization Bearer token.
export function createHeaders(auth = false) {
  const headers = { ...API_HEADERS };
  if (auth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

// Hàm fetch dùng chung cho toàn bộ service, có xử lý lỗi HTTP và parse JSON.
export async function apiFetch(path, options = {}) {
  const response = await fetch(getApiUrl(path), options);
  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Co loi xay ra tu may chu.");
  }

  return data;
}
