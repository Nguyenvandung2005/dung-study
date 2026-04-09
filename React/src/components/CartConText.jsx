import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    // 1. Khởi tạo giỏ hàng từ localStorage
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem("my_cart");
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // --- PHẦN MỚI: QUẢN LÝ ĐĂNG NHẬP ---
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        // Kiểm tra xem đã có "user_token" trong máy chưa để giữ trạng thái đăng nhập khi F5 trang
        return localStorage.getItem("user_token") ? true : false;
    });

    const login = () => {
        setIsLoggedIn(true);
        localStorage.setItem("user_token", "fake-token-123"); // Giả lập lưu token
    };

    const logout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem("user_token");
    };
    // ----------------------------------

    useEffect(() => {
        localStorage.setItem("my_cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, quantity = 1) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === product.id);
            if (existingItem) {
                return prevItems.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + parseInt(quantity) }
                        : item
                );
            }
            return [...prevItems, { id: product.id, product, quantity: parseInt(quantity) }];
        });
    };

    const updateQuantity = (id, newQuantity) => {
        if (newQuantity < 1) return;
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, quantity: parseInt(newQuantity) } : item
            )
        );
    };

    const removeFromCart = (id) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    // Hàm xóa sạch giỏ hàng (Dùng sau khi thanh toán thành công)
    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <CartContext.Provider
            value={{
                cartItems, addToCart, updateQuantity, removeFromCart, clearCart,
                isLoggedIn, login, logout // Xuất thêm các biến này ra
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}