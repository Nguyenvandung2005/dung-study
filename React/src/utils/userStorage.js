// ============================================================
// userStorage.js — Quản lý tài khoản người dùng trong localStorage
// Key: "pinkycloud_users" → mảng các tài khoản đã đăng ký
// ============================================================

const USERS_KEY = "pinkycloud_users";

// Đọc toàn bộ danh sách tài khoản
export function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

// Lưu danh sách tài khoản
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Đăng ký tài khoản mới
// Trả về: { success: true, user } hoặc { success: false, error: "..." }
export function registerUser({ contact, password, name, gender, dob }) {
  const users = getUsers();

  // Kiểm tra trùng email/SĐT
  const exists = users.find(
    (u) => u.contact.toLowerCase() === contact.toLowerCase()
  );
  if (exists) {
    return { success: false, error: "Email hoặc số điện thoại này đã được đăng ký." };
  }

  const newUser = {
    id: Date.now().toString(),
    contact,       // email hoặc SĐT — dùng để đăng nhập
    email: contact.includes("@") ? contact : "",
    phone: !contact.includes("@") ? contact : "",
    password,      // ⚠️ Demo: lưu plain text. Thực tế cần hash (bcrypt)
    name,
    gender,
    dob,
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);
  return { success: true, user: newUser };
}

// Đăng nhập
// Trả về: { success: true, user } hoặc { success: false, error: "..." }
export function loginUser(contact, password) {
  const users = getUsers();
  const found = users.find(
    (u) =>
      u.contact.toLowerCase() === contact.toLowerCase() &&
      u.password === password
  );
  if (!found) {
    return { success: false, error: "Email/SĐT hoặc mật khẩu không đúng." };
  }
  return { success: true, user: found };
}

// Kiểm tra email/SĐT đã tồn tại chưa (dùng để validate realtime)
export function isContactTaken(contact) {
  return getUsers().some(
    (u) => u.contact.toLowerCase() === contact.toLowerCase()
  );
}