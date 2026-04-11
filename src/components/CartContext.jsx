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
    // 1. SỬA Ở ĐÂY: Khởi tạo giỏ hàng từ localStorage thay vì mảng rỗng
    const [cartItems, setCartItems] = useState(() => storage.get("cartItems", []));

    const [isLoggedIn, setIsLoggedIn] = useState(() => storage.get("isLoggedIn", false));
    const [currentUser, setCurrentUser] = useState(() => storage.get("currentUser", null));

    // 2. THÊM Ở ĐÂY: Tự động lưu giỏ hàng xuống localStorage mỗi khi có sự thay đổi (thêm, sửa, xóa)
    useEffect(() => {
        storage.set("cartItems", cartItems);
    }, [cartItems]);

    // -------------------------------------------------------
    // QUẢN LÝ ĐỊA CHỈ
    // -------------------------------------------------------
    const addressKey = currentUser?.email
        ? `addresses_${currentUser.email}`
        : "addresses_guest";

    const [addresses, setAddresses] = useState(() => storage.get(addressKey, []));

    useEffect(() => {
        setAddresses(storage.get(addressKey, []));
    }, [addressKey]);

    useEffect(() => {
        storage.set(addressKey, addresses);
    }, [addresses, addressKey]);

    const addAddress = (addressData) => {
        const newAddr = {
            ...addressData,
            id: Date.now().toString(),
        };
        setAddresses((prev) => {
            let updated;
            if (newAddr.isDefault) {
                updated = prev.map((a) => ({ ...a, isDefault: false }));
            } else {
                updated = [...prev];
            }
            if (updated.length === 0) newAddr.isDefault = true;
            return [...updated, newAddr];
        });
        return newAddr;
    };

    const updateAddress = (id, updatedData) => {
        setAddresses((prev) => {
            let updated = prev.map((a) => a.id === id ? { ...a, ...updatedData } : a);
            if (updatedData.isDefault) {
                updated = updated.map((a) => ({ ...a, isDefault: a.id === id }));
            }
            return updated;
        });
    };

    const removeAddress = (id) => {
        setAddresses((prev) => {
            const filtered = prev.filter((a) => a.id !== id);
            if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
                filtered[0].isDefault = true;
            }
            return filtered;
        });
    };

    const setDefaultAddress = (id) => {
        setAddresses((prev) =>
            prev.map((a) => ({ ...a, isDefault: a.id === id }))
        );
    };

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

    // 3. SỬA Ở ĐÂY: Cho phép nhận số lượng từ trang Chi tiết sản phẩm
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