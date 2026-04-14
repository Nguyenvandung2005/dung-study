

const USERS_KEY = "pinkycloud_users";

// Tài khoản Admin mặc định để phục vụ việc kiểm thử trang Quản trị
const DEFAULT_ADMIN = {
  id: "admin-local",
  contact: "admin@pinkycloud.vn",
  email: "admin@pinkycloud.vn",
  phone: "",
  password: "Admin@123",
  name: "Quản trị viên",
  gender: "khong_xac_dinh",
  dob: "",
  role: "admin", // Quyền cao nhất
  createdAt: "2026-04-13T00:00:00.000Z",
};

/**
 * Lấy danh sách người dùng từ LocalStorage.
 * Nếu chưa có Admin, tự động thêm Admin vào danh sách.
 */
export const getUsers = () => {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

    // Kiểm tra xem tài khoản admin mặc định đã tồn tại trong danh sách chưa
    if (users.some((user) => user.contact?.toLowerCase() === DEFAULT_ADMIN.contact)) {
      return users;
    }

    // Nếu chưa có, nạp admin vào đầu danh sách và lưu lại
    const seededUsers = [DEFAULT_ADMIN, ...users];
    localStorage.setItem(USERS_KEY, JSON.stringify(seededUsers));
    return seededUsers;
  } catch (error) {
    // Nếu có lỗi dữ liệu, reset về danh sách chỉ có Admin
    localStorage.setItem(USERS_KEY, JSON.stringify([DEFAULT_ADMIN]));
    return [DEFAULT_ADMIN];
  }
};

/**
 * Lưu toàn bộ danh sách người dùng vào LocalStorage.
 */
const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * Xử lý đăng ký tài khoản mới.
 * Kiểm tra trùng lặp thông tin trước khi lưu.
 */
export const registerUser = ({ contact, password, name, gender, dob }) => {
  const users = getUsers();
  const normalizedContact = String(contact).trim().toLowerCase();

  // Kiểm tra xem Email/SĐT đã được sử dụng chưa
  const exists = users.find(
    (user) => user.contact.toLowerCase() === normalizedContact
  );

  if (exists) {
    return { success: false, error: "Email hoặc số điện thoại này đã được đăng ký." };
  }

  // Khởi tạo đối tượng người dùng mới
  const newUser = {
    id: Date.now().toString(), // Tạo ID duy nhất bằng thời gian hiện tại
    contact: normalizedContact,
    email: normalizedContact.includes("@") ? normalizedContact : "",
    phone: !normalizedContact.includes("@") ? normalizedContact : "",
    password, // Lưu mật khẩu (Lưu ý: Thực tế nên mã hóa mật khẩu)
    name: String(name).trim(),
    gender,
    dob,
    role: "user", // Tài khoản mới mặc định là người dùng thường
    createdAt: new Date().toISOString(),
  };

  // Cập nhật danh sách và lưu trữ
  saveUsers([...users, newUser]);
  return { success: true, user: newUser };
};

/**
 * Xử lý kiểm tra thông tin đăng nhập.
 */
export const loginUser = (contact, password) => {
  const normalizedContact = String(contact).trim().toLowerCase();
  const users = getUsers();

  // Tìm tài khoản khớp cả tên đăng nhập và mật khẩu
  const found = users.find(
    (user) =>
      user.contact.toLowerCase() === normalizedContact &&
      user.password === password
  );

  if (!found) {
    return { success: false, error: "Email/SĐT hoặc mật khẩu không đúng." };
  }

  return { success: true, user: found };
};

/**
 * Kiểm tra nhanh sự tồn tại của Email/SĐT (Dùng cho validation phía giao diện).
 */
export const isContactTaken = (contact) => {
  const normalizedContact = String(contact).trim().toLowerCase();
  return getUsers().some(
    (user) => user.contact.toLowerCase() === normalizedContact
  );
};