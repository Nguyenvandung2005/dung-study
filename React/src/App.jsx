// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./components/CartConText";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AccountPage from "./pages/AccountPage";
import ContactPage from "./pages/ContactPage";

export default function App() {
  const [query, setQuery] = useState("");

  return (
    <CartProvider>
      <BrowserRouter>
        <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
          <Header searchValue={query} onSearchChange={setQuery} />

          <main style={{ flex: 1 }}>
            <Routes>
              {/* Trang chủ — dùng ProductListPage tạm, sau thay bằng HomePage */}
              <Route path="/" element={<ProductListPage query={query} />} />
              <Route path="/bo-suu-tap" element={<ProductListPage query={query} />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />

              {/* Tài khoản */}
              <Route path="/account" element={<AccountPage />} />
              <Route path="/account/orders" element={<AccountPage />} />
              <Route path="/account/wishlist" element={<AccountPage />} />
              <Route path="/account/address" element={<AccountPage />} />
              <Route path="/lien-he" element={<ContactPage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}