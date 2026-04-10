import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

// Helper đọc/ghi localStorage an toàn
const storage = {
    get: (key, fallback = null) => {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    },
    set: (key, value) => {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch { console.warn("localStorage không khả dụng"); }
    },
    remove: (key) => {
        try { localStorage.removeItem(key); }
        catch { }
    },
};

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(() => storage.get("isLoggedIn", false));
    const [currentUser, setCurrentUser] = useState(() => storage.get("currentUser", null));

    // -------------------------------------------------------
    // QUẢN LÝ ĐỊA CHỈ
    // addresses: mảng địa chỉ, mỗi phần tử có thêm `id`
    // Key localStorage theo email user để mỗi tài khoản riêng
    // -------------------------------------------------------
    const addressKey = currentUser?.email
        ? `addresses_${currentUser.email}`
        : "addresses_guest";

    const [addresses, setAddresses] = useState(() => storage.get(addressKey, []));

    // Khi user thay đổi (login/logout) → load lại địa chỉ tương ứng
    useEffect(() => {
        setAddresses(storage.get(addressKey, []));
    }, [addressKey]);

    // Lưu addresses xuống localStorage mỗi khi thay đổi
    useEffect(() => {
        storage.set(addressKey, addresses);
    }, [addresses, addressKey]);

    /** Thêm địa chỉ mới */
    const addAddress = (addressData) => {
        const newAddr = {
            ...addressData,
            id: Date.now().toString(), // id unique
        };
        setAddresses((prev) => {
            let updated;
            if (newAddr.isDefault) {
                // Bỏ mặc định của các địa chỉ cũ
                updated = prev.map((a) => ({ ...a, isDefault: false }));
            } else {
                updated = [...prev];
            }
            // Nếu chưa có địa chỉ nào → tự đặt làm mặc định
            if (updated.length === 0) newAddr.isDefault = true;
            return [...updated, newAddr];
        });
        return newAddr;
    };

    /** Cập nhật địa chỉ đã có */
    const updateAddress = (id, updatedData) => {
        setAddresses((prev) => {
            let updated = prev.map((a) => a.id === id ? { ...a, ...updatedData } : a);
            if (updatedData.isDefault) {
                updated = updated.map((a) => ({ ...a, isDefault: a.id === id }));
            }
            return updated;
        });
    };

    /** Xóa địa chỉ */
    const removeAddress = (id) => {
        setAddresses((prev) => {
            const filtered = prev.filter((a) => a.id !== id);
            // Nếu xóa địa chỉ mặc định → đặt phần tử đầu tiên làm mặc định
            if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
                filtered[0].isDefault = true;
            }
            return filtered;
        });
    };

    /** Đặt địa chỉ mặc định */
    const setDefaultAddress = (id) => {
        setAddresses((prev) =>
            prev.map((a) => ({ ...a, isDefault: a.id === id }))
        );
    };

    /** Lấy địa chỉ mặc định */
    const getDefaultAddress = () =>
        addresses.find((a) => a.isDefault) || addresses[0] || null;

    // -------------------------------------------------------
    // ĐĂNG NHẬP / ĐĂNG XUẤT
    // -------------------------------------------------------
    const login = (userInfo = {}) => {
        setIsLoggedIn(true);
        setCurrentUser(userInfo);
        storage.set("isLoggedIn", true);
        storage.set("currentUser", userInfo);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        storage.remove("isLoggedIn");
        storage.remove("currentUser");
    };

    // -------------------------------------------------------
    // GIỎ HÀNG
    // -------------------------------------------------------
    const addToCart = (product) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { id: product.id, product, quantity: 1 }];
        });
    };

    const updateQuantity = (id, quantity) => {
        const qty = parseInt(quantity) || 1;
        setCartItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, qty) } : item))
        );
    };

    const removeFromCart = (id) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    const clearCart = () => setCartItems([]);

    return (
        <CartContext.Provider value={{
            // Giỏ hàng
            cartItems, addToCart, updateQuantity, removeFromCart, clearCart,
            // Auth
            isLoggedIn, currentUser, login, logout,
            // Địa chỉ
            addresses, addAddress, updateAddress, removeAddress,
            setDefaultAddress, getDefaultAddress,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}