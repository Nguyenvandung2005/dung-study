import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { meApi } from "../services/authService";
import { getCartApi, saveCartApi } from "../services/cartService";

const CartContext = createContext();

//  Helper đọc/ghi localStorage 
const saveToLocal = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const loadFromLocal = (key, fallback = null) => {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const removeFromLocal = (key) => {
  localStorage.removeItem(key);
};

export function CartProvider({ children }) {
  // State chính 
  // Khởi tạo từ localStorage để giỏ hàng không mất khi F5
  const [cartItems, setCartItems] = useState(() => loadFromLocal("guestCartItems", []));
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem("authToken")));
  const [currentUser, setCurrentUser] = useState(() => loadFromLocal("currentUser", null));
  const [authLoading, setAuthLoading] = useState(true);
  const [cartHydrated, setCartHydrated] = useState(false);

  // Ref dùng cho debounce sync giỏ hàng lên server
  const cartSyncTimer = useRef(null);

  //  Lưu giỏ hàng vào localStorage khi thay đổi (chỉ khi là guest)
  useEffect(() => {
    if (isLoggedIn && currentUser) return; // đã login → không cần lưu local
    saveToLocal("guestCartItems", cartItems);
  }, [cartItems, isLoggedIn, currentUser]);

  // Khởi động app: kiểm tra token → lấy thông tin user + giỏ hàng 
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setAuthLoading(false);
      setCartHydrated(true);
      return;
    }

    // Gọi song song 2 API: lấy thông tin user + giỏ hàng từ server
    Promise.all([meApi(), getCartApi()])
      .then(([{ user }, cartResponse]) => {
        setCurrentUser(user);
        setIsLoggedIn(true);
        saveToLocal("currentUser", user);
        setCartItems(cartResponse.items || []);
      })
      .catch(() => {
        // Token hết hạn hoặc lỗi → xóa auth, fallback về giỏ hàng guest
        localStorage.removeItem("authToken");
        removeFromLocal("currentUser");
        setCurrentUser(null);
        setIsLoggedIn(false);
        setCartItems(loadFromLocal("guestCartItems", []));
      })
      .finally(() => {
        setAuthLoading(false);
        setCartHydrated(true);
      });
  }, []);

  //  Debounce sync giỏ hàng lên server sau mỗi lần cartItems thay đổi 
  // Chờ 250ms sau lần thay đổi cuối cùng rồi mới gọi API (tránh gọi liên tục)
  useEffect(() => {
    if (!isLoggedIn || !currentUser || !cartHydrated) return;

    if (cartSyncTimer.current) clearTimeout(cartSyncTimer.current);

    cartSyncTimer.current = setTimeout(() => {
      saveCartApi(
        cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        }))
      ).catch(() => {
        // Sync thất bại → giữ nguyên UI, không báo lỗi người dùng
      });
    }, 250);

    return () => {
      if (cartSyncTimer.current) clearTimeout(cartSyncTimer.current);
    };
  }, [cartItems, isLoggedIn, currentUser, cartHydrated]);

  //  Địa chỉ giao hàng — lưu theo email user hoặc "guest"
  const addressKey = currentUser?.email
    ? `addresses_${currentUser.email}`
    : "addresses_guest";

  const [addresses, setAddresses] = useState(() => loadFromLocal(addressKey, []));

  // Khi đổi user (login/logout) → load lại địa chỉ tương ứng
  useEffect(() => {
    setAddresses(loadFromLocal(addressKey, []));
  }, [addressKey]);

  // Tự động lưu địa chỉ vào localStorage mỗi khi thay đổi
  useEffect(() => {
    saveToLocal(addressKey, addresses);
  }, [addresses, addressKey]);

  //  CRUD địa chỉ giao hàng 

  // Thêm địa chỉ mới — địa chỉ đầu tiên tự động làm default
  const addAddress = (addressData) => {
    const newAddr = { ...addressData, id: Date.now().toString() };
    setAddresses((prev) => {
      let updated = prev;
      if (newAddr.isDefault) {
        updated = prev.map((item) => ({ ...item, isDefault: false }));
      }
      if (updated.length === 0) newAddr.isDefault = true;
      return [...updated, newAddr];
    });
    return newAddr;
  };

  // Cập nhật địa chỉ — nếu set làm default thì bỏ default các địa chỉ còn lại
  const updateAddress = (id, updatedData) => {
    setAddresses((prev) => {
      let updated = prev.map((item) =>
        item.id === id ? { ...item, ...updatedData } : item
      );
      if (updatedData.isDefault) {
        updated = updated.map((item) => ({ ...item, isDefault: item.id === id }));
      }
      return updated;
    });
  };

  // Xóa địa chỉ — nếu xóa default thì tự động set địa chỉ đầu tiên còn lại làm default
  const removeAddress = (id) => {
    setAddresses((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (filtered.length > 0 && !filtered.some((item) => item.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  // Đặt một địa chỉ làm mặc định, bỏ default tất cả địa chỉ còn lại
  const setDefaultAddress = (id) => {
    setAddresses((prev) =>
      prev.map((item) => ({ ...item, isDefault: item.id === id }))
    );
  };

  // Lấy địa chỉ mặc định, fallback về địa chỉ đầu tiên, hoặc null nếu chưa có
  const getDefaultAddress = () =>
    addresses.find((item) => item.isDefault) || addresses[0] || null;

  //  Đăng nhập: lưu token + load giỏ hàng từ server 
  const login = async (userInfo = {}, token = "") => {
    if (token) localStorage.setItem("authToken", token);
    setIsLoggedIn(true);
    setCurrentUser(userInfo);
    saveToLocal("currentUser", userInfo);

    try {
      const cartResponse = await getCartApi();
      setCartItems(cartResponse.items || []);
    } catch {
      setCartItems([]);
    } finally {
      setCartHydrated(true);
    }
  };

  // Đăng xuất: xóa auth + quay về giỏ hàng guest
  const logout = () => {
    localStorage.removeItem("authToken");
    removeFromLocal("currentUser");
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCartItems(loadFromLocal("guestCartItems", []));
    setCartHydrated(true);
  };

  //  Thêm sản phẩm vào giỏ 
  // Nếu đã có → cộng thêm số lượng; chưa có → thêm mới
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

  //Cập nhật số lượng sản phẩm trong giỏ (tối thiểu là 1) 
  const updateQuantity = (id, quantity) => {
    const qty = parseInt(quantity, 10) || 1;
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  //  Xóa một sản phẩm khỏi giỏ 
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  //  Xóa toàn bộ giỏ hàng (dùng sau khi đặt hàng thành công) 
  const clearCart = () => setCartItems([]);

  //  Cung cấp toàn bộ state + hàm xử lý cho các component con 
  return (
    <CartContext.Provider
      value={{
        cartItems,
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

// Hook tiện ích — dùng thay cho useContext(CartContext) ở mọi component 
export const useCart = () => useContext(CartContext);