import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// Tạo Context để chia sẻ dữ liệu giỏ hàng và người dùng trong toàn bộ ứng dụng
const CartContext = createContext();

// Các từ khóa hằng số để lưu trữ vào LocalStorage
const CURRENT_USER_KEY = "currentUser";
const GUEST_CART_KEY = "guestCartItems";

// --- CÁC HÀM HỖ TRỢ XỬ LÝ LOCALSTORAGE ---

// Lưu dữ liệu vào LocalStorage (chuyển vật thể JS sang chuỗi JSON)
function saveToLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Đọc dữ liệu từ LocalStorage (chuyển chuỗi JSON ngược lại thành vật thể JS)
function loadFromLocal(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Xóa dữ liệu khỏi LocalStorage
function removeFromLocal(key) {
  localStorage.removeItem(key);
}

// Tạo khóa lưu trữ riêng biệt cho từng người dùng (dựa trên email hoặc ID)
function getUserStorageKey(prefix, user) {
  const identity = user?.contact || user?.email || user?.id;
  return identity ? `${prefix}_${identity}` : `${prefix}_guest`;
}

export function CartProvider({ children }) {
  // --- QUẢN LÝ TRẠNG THÁI NGƯỜI DÙNG (AUTH) ---
  const [currentUser, setCurrentUser] = useState(() =>
    loadFromLocal(CURRENT_USER_KEY, null)
  );
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    Boolean(loadFromLocal(CURRENT_USER_KEY, null))
  );
  const [authLoading] = useState(false);

  // Tạo khóa động cho giỏ hàng và địa chỉ dựa trên người dùng hiện tại
  const cartStorageKey = useMemo(
    () => getUserStorageKey("cartItems", currentUser),
    [currentUser]
  );
  const addressStorageKey = useMemo(
    () => getUserStorageKey("addresses", currentUser),
    [currentUser]
  );

  // --- QUẢN LÝ GIỎ HÀNG ---
  const [cartItems, setCartItems] = useState(() => {
    const user = loadFromLocal(CURRENT_USER_KEY, null);
    const initialKey = user ? getUserStorageKey("cartItems", user) : GUEST_CART_KEY;
    return loadFromLocal(initialKey, []);
  });

  // --- QUẢN LÝ SỔ ĐỊA CHỈ ---
  const [addresses, setAddresses] = useState(() =>
    loadFromLocal(getUserStorageKey("addresses", loadFromLocal(CURRENT_USER_KEY, null)), [])
  );

  // Tự động nạp lại dữ liệu giỏ hàng/địa chỉ khi thay đổi tài khoản đăng nhập
  useEffect(() => {
    const nextCartKey = currentUser ? cartStorageKey : GUEST_CART_KEY;
    setCartItems(loadFromLocal(nextCartKey, []));
    setAddresses(loadFromLocal(addressStorageKey, []));
  }, [currentUser, cartStorageKey, addressStorageKey]);

  // Lưu giỏ hàng vào LocalStorage mỗi khi danh sách sản phẩm thay đổi
  useEffect(() => {
    const targetKey = currentUser ? cartStorageKey : GUEST_CART_KEY;
    saveToLocal(targetKey, cartItems);
  }, [cartItems, currentUser, cartStorageKey]);

  // Lưu danh sách địa chỉ vào LocalStorage mỗi khi có thay đổi
  useEffect(() => {
    saveToLocal(addressStorageKey, addresses);
  }, [addresses, addressStorageKey]);

  // --- CÁC HÀM XỬ LÝ ĐỊA CHỈ ---

  // Thêm địa chỉ mới và xử lý trạng thái mặc định
  const addAddress = (addressData) => {
    const newAddress = { ...addressData, id: Date.now().toString() };

    setAddresses((prev) => {
      let nextAddresses = prev;

      // Nếu địa chỉ mới là mặc định, bỏ trạng thái mặc định của các địa chỉ cũ
      if (newAddress.isDefault) {
        nextAddresses = prev.map((item) => ({ ...item, isDefault: false }));
      }

      // Nếu đây là địa chỉ đầu tiên, tự động đặt làm mặc định
      if (nextAddresses.length === 0) {
        newAddress.isDefault = true;
      }

      return [...nextAddresses, newAddress];
    });

    return newAddress;
  };

  // Cập nhật thông tin địa chỉ đã tồn tại
  const updateAddress = (id, updatedData) => {
    setAddresses((prev) => {
      let nextAddresses = prev.map((item) =>
        item.id === id ? { ...item, ...updatedData } : item
      );

      // Đảm bảo chỉ có duy nhất một địa chỉ mặc định
      if (updatedData.isDefault) {
        nextAddresses = nextAddresses.map((item) => ({
          ...item,
          isDefault: item.id === id,
        }));
      }

      return nextAddresses;
    });
  };

  // Xóa địa chỉ và tự động chuyển trạng thái mặc định cho địa chỉ khác nếu cần
  const removeAddress = (id) => {
    setAddresses((prev) => {
      const filtered = prev.filter((item) => item.id !== id);

      if (filtered.length > 0 && !filtered.some((item) => item.isDefault)) {
        filtered[0] = { ...filtered[0], isDefault: true };
      }

      return filtered;
    });
  };

  // Đặt một địa chỉ cụ thể làm địa chỉ mặc định
  const setDefaultAddress = (id) => {
    setAddresses((prev) =>
      prev.map((item) => ({ ...item, isDefault: item.id === id }))
    );
  };

  // Lấy ra địa chỉ mặc định hiện tại
  const getDefaultAddress = () =>
    addresses.find((item) => item.isDefault) || addresses[0] || null;

  // --- CÁC HÀM XỬ LÝ ĐĂNG NHẬP / ĐĂNG XUẤT ---

  // Xử lý đăng nhập: Lưu thông tin user và cập nhật trạng thái
  const login = (userInfo = {}) => {
    saveToLocal(CURRENT_USER_KEY, userInfo);
    setCurrentUser(userInfo);
    setIsLoggedIn(true);
  };

  // Xử lý đăng xuất: Xóa thông tin user và quay về giỏ hàng của khách (guest)
  const logout = () => {
    removeFromLocal(CURRENT_USER_KEY);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCartItems(loadFromLocal(GUEST_CART_KEY, []));
    setAddresses(loadFromLocal("addresses_guest", []));
  };

  // --- CÁC HÀM XỬ LÝ GIỎ HÀNG (CART) ---

  // Thêm sản phẩm vào giỏ hàng hoặc tăng số lượng nếu đã tồn tại
  const addToCart = (product, quantityToAdd = 1) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }

      return [...prev, { id: product.id, product, quantity: quantityToAdd }];
    });
  };

  // Cập nhật số lượng của một sản phẩm cụ thể trong giỏ
  const updateQuantity = (id, quantity) => {
    const normalizedQuantity = parseInt(quantity, 10) || 1;

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, normalizedQuantity) }
          : item
      )
    );
  };

  // Xóa hoàn toàn một sản phẩm khỏi giỏ hàng
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Làm trống toàn bộ giỏ hàng
  const clearCart = () => setCartItems([]);

  // Cung cấp các giá trị và hàm xử lý cho các Component con
  return (
    <CartContext.Provider
      value={{
        cartItems,
        cart: cartItems,
        // Tính tổng số lượng tất cả sản phẩm trong giỏ để hiển thị ở Icon giỏ hàng
        cartCount: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isLoggedIn,
        currentUser,
        login,
        logout,
        authLoading,
        addresses,
        addAddress,
        updateAddress,
        removeAddress,
        setDefaultAddress,
        getDefaultAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook tùy chỉnh để sử dụng CartContext một cách nhanh chóng
export const useCart = () => useContext(CartContext);