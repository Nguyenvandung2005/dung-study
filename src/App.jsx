// src/App.jsx
import React from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./components/HomePage";

export default function App() {
  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
      <Header />

      <main style={{ flex: 1 }}>
        <HomePage />
      </main>

      <Footer />
    </div>
  );
}
