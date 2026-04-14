import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import { useCart } from "./CartContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useCart();
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const openLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const openRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleCloseAll = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
    navigate("/");
  };

  const handleLoginSuccess = (userInfo, token) => {
    login(userInfo || {}, token || "");
    setShowLoginModal(false);
    navigate("/");
  };

  return (
    <>
      <LoginModal
        show={showLoginModal}
        onClose={handleCloseAll}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={openRegister}
      />
      <RegisterModal
        show={showRegisterModal}
        onClose={handleCloseAll}
        onSwitchToLogin={openLogin}
      />
    </>
  );
}
