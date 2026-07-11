import axios from 'axios';

const getDefaultApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://dung-study.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || getDefaultApiUrl(),
  withCredentials: false,
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken }
        );
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    // Tự động chuyển đổi các lỗi kỹ thuật/mạng thành thông báo tiếng Việt dễ hiểu
    if (!error.response) {
      const netMsg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc bật lại Server/Database.';
      error.userMessage = netMsg;
      error.response = { data: { message: netMsg } };
    } else {
      let rawMsg = error.response?.data?.message || 'Đã xảy ra lỗi khi xử lý yêu cầu.';
      if (typeof rawMsg === 'string') {
        if (rawMsg.includes("Can't reach database server") || rawMsg.includes('PrismaClient') || rawMsg.includes('P1001')) {
          rawMsg = 'Máy chủ cơ sở dữ liệu đang tạm dừng. Vui lòng bật lại database (Power On trên Aiven) hoặc thử lại sau.';
        } else if (rawMsg.includes('invocation in') || rawMsg.includes('Invalid `prisma.')) {
          rawMsg = 'Hệ thống đang gặp sự cố khi truy vấn dữ liệu. Vui lòng thử lại sau.';
        }
      }
      if (error.response.data && typeof error.response.data === 'object') {
        error.response.data.message = rawMsg;
      }
      error.userMessage = rawMsg;
    }

    return Promise.reject(error);
  }
);
export const getFullUploadUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const apiUrl = import.meta.env.VITE_API_URL || getDefaultApiUrl();
  const serverBase = apiUrl.replace(/\/api$/, '');
  return `${serverBase}${path}`;
};

export default api;
