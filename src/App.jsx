import React, { useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
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
import AccountPage from "./pages/AccountPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import useFetch from "./hooks/useFetch";

export default function App() {
  const [query, setQuery] = useState("");
  const [searchNotice, setSearchNotice] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { data: newsItemsData } = useFetch("/api/news-items");
  const newsItems = Array.isArray(newsItemsData) ? newsItemsData : [];

  const handleSearchSubmit = (rawKeyword = "") => {
    const keyword = rawKeyword.trim().toLowerCase();
    if (!keyword) return;
    setSearchNotice("");

    const isInNewsContext = location.pathname.startsWith("/tin-tuc");
    const isInHomeContext = location.pathname === "/";
    const isInProductsContext = location.pathname.startsWith("/san-pham");

    if (isInNewsContext) {
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

      setSearchNotice(`Không tìm thấy bài viết phù hợp với từ khóa "${rawKeyword.trim()}".`);
      return;
    }

    // Tim kiem tai cho: Trang chu va Trang san pham se tu xu ly theo prop query.
    if (isInHomeContext || isInProductsContext) {
      return;
    }
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
            <Route
              path="/tin-tuc/:slug"
              element={<NewsDetailPage searchNotice={searchNotice} />}
            />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/orders" element={<AccountPage />} />
            <Route path="/account/wishlist" element={<AccountPage />} />
            <Route path="/account/address" element={<AccountPage />} />
            <Route path="/admin/san-pham" element={<AdminProductsPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
}
