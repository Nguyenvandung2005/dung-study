import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { CartProvider } from "./components/CartContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./components/HomePage";
import NewsDetailPage from "./components/NewsDetailPage";
import ProductListPage from "./components/ProductListPage";
import ProductDetailPage from "./components/ProductDetailPage";
import CartPage from "./components/CartPage";
import AboutUs from "./components/AboutUs";
import Login from "./components/Login";
import Register from "./components/Register";

export default function App() {
  const [query, setQuery] = useState("");

  return (
    <CartProvider>
      <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
        <Header searchValue={query} onSearchChange={setQuery} />

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/san-pham" element={<ProductListPage query={query} />} />
            <Route path="/san-pham/:id" element={<ProductDetailPage />} />
            <Route path="/gio-hang" element={<CartPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/tin-tuc/:slug" element={<NewsDetailPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
}
