import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    // 1. Khởi tạo giỏ hàng từ localStorage (nếu có)
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem("my_cart");
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // 2. Lưu vào localStorage mỗi khi giỏ hàng thay đổi
    useEffect(() => {
        localStorage.setItem("my_cart", JSON.stringify(cartItems));
    }, [cartItems]);

    // 3. Hàm Thêm vào giỏ
    const addToCart = (product, quantity = 1) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === product.id);
            if (existingItem) {
                return prevItems.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevItems, { id: product.id, product, quantity }];
        });
    };

    // 4. Hàm Cập nhật số lượng
    const updateQuantity = (id, newQuantity) => {
        if (newQuantity < 1) return;
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, quantity: parseInt(newQuantity) } : item
            )
        );
    };

    // 5. Hàm Xóa sản phẩm
    const removeFromCart = (id) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart }}>
            {children}
        </CartContext.Provider>
    );
}

// Hook để các file khác lấy dữ liệu ra dùng
export function useCart() {
    return useContext(CartContext);
}