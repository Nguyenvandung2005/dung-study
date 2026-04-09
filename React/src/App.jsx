// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./components/CartConText";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";

export default function App() {
  const [query, setQuery] = useState("");

  return (
    <CartProvider>
      <BrowserRouter>
        <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
          <Header searchValue={query} onSearchChange={setQuery} />

          <main style={{ flex: 1 }}>
            <Routes>
              {/* 1. Trang chủ bây giờ sẽ gọi HomePage */}
              {/* <Route path="/" element={<HomePage />} /> */}
              <Route path="/bo-suu-tap" element={<ProductListPage query={query} />} />

              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}