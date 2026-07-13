import React, { useEffect, useState } from 'react';

export default function GeoGebraBoard({ onApply, onClose }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let script = document.getElementById('geogebra-script');
    
    const initApplet = () => {
      setLoading(false);
      const params = {
        appName: "classic",
        width: window.innerWidth - 60, // Padding
        height: window.innerHeight - 140, // Header padding
        showToolBar: true,
        showAlgebraInput: true,
        showMenuBar: true,
        language: "vi",
        useBrowserForJS: false,
        enableRightClick: true,
        enableShiftDragZoom: true,
      };
      
      // Khởi tạo applet
      const applet = new window.GGBApplet(params, true);
      applet.inject('ggb-element');
    };

    if (!script) {
      script = document.createElement('script');
      script.id = 'geogebra-script';
      script.src = 'https://www.geogebra.org/apps/deployggb.js';
      script.onload = () => {
        initApplet();
      };
      document.head.appendChild(script);
    } else {
      if (window.GGBApplet) {
        initApplet();
      } else {
        script.addEventListener('load', initApplet);
      }
    }

    // Resize handler
    const handleResize = () => {
      if (window.ggbApplet && typeof window.ggbApplet.setSize === 'function') {
        window.ggbApplet.setSize(window.innerWidth - 60, window.innerHeight - 140);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (script && !window.GGBApplet) {
        script.removeEventListener('load', initApplet);
      }
      // Dọn dẹp DOM nếu cần thiết (GeoGebra có thể không hỗ trợ clean up hoàn toàn)
      const ggbElement = document.getElementById('ggb-element');
      if (ggbElement) {
        ggbElement.innerHTML = '';
      }
      // Xóa global window.ggbApplet
      if (window.ggbApplet) {
        delete window.ggbApplet;
      }
    };
  }, []);

  const handleExport = () => {
    if (window.ggbApplet) {
      // GeoGebra API: exportSVG(callback)
      window.ggbApplet.exportSVG((svg) => {
        onApply(svg);
      });
    } else {
      alert("Công cụ GeoGebra chưa được tải hoàn tất.");
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(10,14,26,0.95)', backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 30px'
    }}>
      {/* Header */}
      <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16, marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.6rem' }}>📐</span> GeoGebra Classic
          </h3>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>Bảng vẽ hình học chuyên nghiệp. 💡 Công cụ "Hình vẽ tự do" (cái bút) nằm ở nhóm công cụ cuối cùng.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={onClose}>Hủy & Đóng</button>
          <button className="btn btn-primary" onClick={handleExport} disabled={loading} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            💾 Hoàn tất & Lưu Hình SVG
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div style={{ flex: 1, background: '#fff', borderRadius: 8, overflow: 'hidden', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {loading && (
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#1e293b' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, borderTopColor: '#3b82f6', marginBottom: 12 }} />
            <p>Đang tải bộ công cụ Toán học GeoGebra...</p>
          </div>
        )}
        
        {/* GeoGebra container */}
        <div id="ggb-element" style={{ width: '100%', height: '100%' }}></div>
      </div>
    </div>
  );
}
