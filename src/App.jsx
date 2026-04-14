import React, { useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { CartProvider } from "./components/CartContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import NewsDetailPage from "./pages/NewsDetailPage";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import AboutUs from "./components/AboutUs";
import Login from "./components/Login";
import Register from "./components/Register";
import PolicyPage from "./pages/PolicyPage";
import ContactPage from "./pages/ContactPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import newsItems from "./data/newsItems.json";

export default function App() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = (rawKeyword = "") => {
    const keyword = rawKeyword.trim().toLowerCase();
    if (!keyword) return;

    const matchedNews = newsItems.find((item) => {
      const joinedContent = [
        item.title,
        item.excerpt,
        item.content,
        item.category,
      ]
        .join(" ")
        .toLowerCase();

      return joinedContent.includes(keyword);
    });

    if (matchedNews?.slug) {
      navigate(`/tin-tuc/${matchedNews.slug}`);
      return;
    }

    navigate("/san-pham");
  };

  return (
    <CartProvider>
      <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
        <Header
          searchValue={query}
          onSearchChange={setQuery}
          onSearchSubmit={handleSearchSubmit}
        />

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage query={query} />} />
            <Route path="/san-pham" element={<ProductListPage query={query} />} />
            <Route path="/san-pham/:id" element={<ProductDetailPage />} />
            <Route path="/gio-hang" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/thanh-toan" element={<CheckoutPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/chinh-sach" element={<PolicyPage />} />
            <Route path="/chinh-sach/:slug" element={<PolicyPage />} />
            <Route path="/lien-he" element={<ContactPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/tin-tuc/:slug" element={<NewsDetailPage />} />
            <Route path="/admin/san-pham" element={<AdminProductsPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
}
