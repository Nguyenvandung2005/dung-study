import React from 'react';
import './LogoWaveBounce.css';

export default function LogoWaveBounce({ size = 'sm' }) {
  return (
    <div className={`logo-bounce-container ${size}`}>
      {/* Radiant Pulsing Ripple Rings */}
      <div className="logo-ripple-ring ring-1" />
      <div className="logo-ripple-ring ring-2" />

      {/* Bouncing Logo Emblem ("Nhảy bóng & Tỏa sáng") */}
      <div className="logo-bounce-emblem">
        <img src="/logo.png" alt="Dung-Study Logo" className="logo-image-inner" />
      </div>
    </div>
  );
}
