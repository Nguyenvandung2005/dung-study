// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductListPage from "./components/ProductListPage";
import AboutUs from "./components/AboutUs";
import Login from "./components/Login";
import Register from "./components/Register";

export default function App() {
  const [query, setQuery] = useState("");

  return (
    <Router>
      <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
        <Header searchValue={query} onSearchChange={setQuery} />

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<ProductListPage query={query} />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
