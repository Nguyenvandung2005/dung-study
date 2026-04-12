import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import { useCart } from "./CartContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useCart();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(true);

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
      <RegisterModal
        show={showRegisterModal}
        onClose={handleCloseAll}
        onSwitchToLogin={openLogin}
      />
      <LoginModal
        show={showLoginModal}
        onClose={handleCloseAll}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={openRegister}
      />
    </>
  );
}
