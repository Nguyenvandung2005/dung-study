import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/client';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

const COLOR_THEMES = [
  { id: 'ruby-red', name: 'Ruby Red', icon: '🔴', desc: 'Đỏ thẫm rực cháy' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🤖', desc: 'Vàng & Neon hồng' },
  { id: 'abyss-blue', name: 'Abyss Blue', icon: '🌌', desc: 'Xanh dương sâu thẳm' },
  { id: 'emerald-forest', name: 'Emerald Forest', icon: '🌿', desc: 'Xanh lục bảo mát mắt' },
  { id: 'sunset-twilight', name: 'Sunset Twilight', icon: '🌅', desc: 'Hoàng hôn lãng mạn' },
  { id: 'clean-glass', name: 'Clean Glass', icon: '🤍', desc: 'Trắng sáng thanh lịch' }
];

const ANIMATIONS = [
  { id: 'particles', name: 'Bụi sao (Particles)', icon: '✨' },
  { id: 'wave', name: 'Sóng lượn (Waves)', icon: '🌊' },
  { id: 'matrix', name: 'Mưa ma trận (Matrix)', icon: '🔢' },
  { id: 'geometric', name: 'Hình học 3D (Shapes)', icon: '💠' },
  { id: 'pulse', name: 'Vòng sóng siêu âm (Pulse)', icon: '💨' }
];

export default function AdminThemeSettings() {
  const { activeTheme, changeTheme } = useTheme();
  
  const [selectedColor, setSelectedColor] = useState(activeTheme?.config?.colorTheme || 'ruby-red');
  const [selectedAnimation, setSelectedAnimation] = useState(activeTheme?.config?.type || 'particles');
  const [isSaving, setIsSaving] = useState(false);

  const handlePreviewColor = (colorId) => {
    setSelectedColor(colorId);
    document.documentElement.setAttribute('data-theme', colorId);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/admin/animation-themes/custom', {
        colorTheme: selectedColor,
        animationType: selectedAnimation
      });
      // Force reload to apply new context everywhere
      window.location.reload();
    } catch (e) {
      alert('Không thể lưu cấu hình. Vui lòng thử lại.');
      setIsSaving(false);
    }
  };

  return (
    <div className="page-layout">
      <AnimatedBackground key={selectedAnimation} overrideType={selectedAnimation} />
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">🎨 Thiết lập <span className="gradient-text">Giao diện (Themes)</span></h1>
            <p className="page-subtitle">Chọn cấu hình màu sắc và hoạt ảnh mặc định cho toàn bộ ứng dụng. Chỉ Admin mới có quyền sửa đổi.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Color Themes */}
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>1. Chọn Màu Sắc Chủ Đạo</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              {COLOR_THEMES.map(theme => (
                <div 
                  key={theme.id}
                  onClick={() => handlePreviewColor(theme.id)}
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: selectedColor === theme.id ? 'var(--border-strong)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${selectedColor === theme.id ? 'var(--clr-primary-500)' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'var(--transition-base)'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{theme.icon}</div>
                  <h4 style={{ color: 'var(--text-primary)' }}>{theme.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{theme.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Background Animations */}
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>2. Chọn Hoạt Ảnh Nền</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
              {ANIMATIONS.map(anim => (
                <div 
                  key={anim.id}
                  onClick={() => setSelectedAnimation(anim.id)}
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: selectedAnimation === anim.id ? 'var(--border-strong)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${selectedAnimation === anim.id ? 'var(--clr-primary-500)' : 'transparent'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'var(--transition-base)'
                  }}
                >
                  <div style={{ fontSize: '1.5rem' }}>{anim.icon}</div>
                  <h4 style={{ color: 'var(--text-primary)' }}>{anim.name}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="glass-card" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--clr-primary-400)' }}>Bạn đang xem trước giao diện: {COLOR_THEMES.find(t=>t.id===selectedColor)?.name} + {ANIMATIONS.find(a=>a.id===selectedAnimation)?.name}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>F5 để khôi phục cấu hình cũ, hoặc bấm Lưu để áp dụng cho mọi tài khoản.</p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Đang lưu...' : '💾 Áp dụng & Lưu cấu hình'}
          </button>
        </div>
      </main>
    </div>
  );
}
