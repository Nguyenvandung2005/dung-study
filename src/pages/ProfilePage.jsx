import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getFullUploadUrl } from '../api/client';
import Sidebar from '../components/ui/Sidebar';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import './Dashboard.css';

const COLOR_THEMES = [
  { id: 'ruby-red', name: 'Ruby Red', icon: '🔴', desc: 'Đỏ thẫm rực cháy', color: '#ea580c' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🤖', desc: 'Vàng & Neon hồng', color: '#eab308' },
  { id: 'abyss-blue', name: 'Abyss Blue', icon: '🌌', desc: 'Xanh dương sâu thẳm', color: '#0ea5e9' },
  { id: 'emerald-forest', name: 'Emerald Forest', icon: '🌿', desc: 'Xanh lục bảo mát mắt', color: '#10b981' },
  { id: 'sunset-twilight', name: 'Sunset Twilight', icon: '🌅', desc: 'Hoàng hôn lãng mạn', color: '#f97316' },
  { id: 'clean-glass', name: 'Clean Glass', icon: '🤍', desc: 'Trắng sáng thanh lịch', color: '#3b82f6' }
];

const ANIMATIONS = [
  { id: 'none', name: 'Không hiệu ứng (Tắt nền động)', icon: '🚫' },
  { id: 'particles', name: 'Bụi sao (Particles)', icon: '✨' },
  { id: 'wave', name: 'Sóng lượn (Waves)', icon: '🌊' },
  { id: 'matrix', name: 'Mưa ma trận (Matrix)', icon: '🔢' },
  { id: 'geometric', name: 'Hình học 3D (Shapes)', icon: '💠' },
  { id: 'pulse', name: 'Vòng sóng siêu âm (Pulse)', icon: '💨' },
  { id: 'study-symbols', name: 'Ký tự tri thức (Study Symbols)', icon: '📐' },
  { id: 'cosmos', name: 'Vũ trụ học tập (Cosmos Stars)', icon: '🌌' },
  { id: 'bubbles', name: 'Bong bóng sắc màu (Bubbles)', icon: '🎈' }
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // Form states
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '',
    grade: user?.grade || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    theme: user?.settings?.theme || 'dark',
    colorTheme: user?.settings?.colorTheme || 'ruby-red',
    primaryColor: user?.settings?.primaryColor || '',
    fontSize: user?.settings?.fontSize || '16px',
    animation: user?.settings?.animation || 'particles'
  });

  const handlePreviewColorTheme = (themeId) => {
    setSettingsForm(prev => ({ ...prev, colorTheme: themeId, primaryColor: '' }));
    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.style.removeProperty('--clr-primary-500');
  };

  const handlePreviewCustomColor = (hex) => {
    setSettingsForm(prev => ({ ...prev, primaryColor: hex }));
    document.documentElement.style.setProperty('--clr-primary-500', hex);
  };

  const handlePreviewThemeMode = (mode) => {
    setSettingsForm(prev => ({ ...prev, theme: mode }));
    if (mode === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };



  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      const { data } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser(data.user);
      showMessage('success', 'Đã cập nhật ảnh đại diện');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await api.put('/users/profile', accountForm);
      updateUser(data.user);
      showMessage('success', 'Đã cập nhật thông tin');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Lỗi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showMessage('error', 'Mật khẩu xác nhận không khớp');
    }
    try {
      setLoading(true);
      await api.put('/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showMessage('success', 'Đã đổi mật khẩu thành công');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Lỗi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.put('/users/profile', { settings: settingsForm });
      updateUser(data.user);
      showMessage('success', 'Đã lưu cấu hình giao diện');
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Lỗi lưu cấu hình');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <AnimatedBackground overrideType={settingsForm.animation} />
      <Sidebar />

      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Hồ sơ <span className="gradient-text">Cá nhân</span></h1>
            <p className="page-subtitle">Quản lý thông tin và cá nhân hóa trải nghiệm của bạn</p>
          </div>
        </div>

        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1rem', padding: '1rem', borderRadius: 8, background: message.type === 'error' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', color: message.type === 'error' ? '#f43f5e' : '#10b981' }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          
          {/* Cột trái: Menu & Avatar */}
          <div className="glass-card" style={{ padding: 'var(--space-5)', textAlign: 'center' }}>
            <div 
              style={{ 
                width: 120, height: 120, borderRadius: '50%', margin: '0 auto var(--space-4)', 
                background: user?.avatar ? `url(${getFullUploadUrl(user.avatar)}) center/cover` : 'var(--clr-primary-500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', color: '#fff', cursor: 'pointer', border: '3px solid var(--border-subtle)',
                position: 'relative', overflow: 'hidden'
              }}
              onClick={handleAvatarClick}
              title="Nhấn để đổi ảnh"
            >
              {!user?.avatar && user?.name?.[0]?.toUpperCase()}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', fontSize: '0.8rem', padding: '4px 0', opacity: 0, transition: 'opacity 0.2s' }} 
                   onMouseEnter={e => e.currentTarget.style.opacity = 1} 
                   onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                Đổi ảnh
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{ display: 'none' }} accept="image/*" />
            
            <h3 style={{ margin: '0 0 var(--space-1) 0', color: 'var(--text-primary)' }}>{user?.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-6)' }}>{user?.email}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className={`btn ${activeTab === 'account' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('account')} style={{ width: '100%' }}>Thông tin chung</button>
              <button className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('settings')} style={{ width: '100%' }}>Cá nhân hóa</button>
              <button className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('password')} style={{ width: '100%' }}>Đổi mật khẩu</button>
            </div>
          </div>

          {/* Cột phải: Content */}
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            
            {activeTab === 'account' && (
              <form onSubmit={handleUpdateAccount}>
                <h3 style={{ marginBottom: 'var(--space-5)', color: 'var(--text-primary)' }}>Thông tin tài khoản</h3>
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label>Họ và tên</label>
                  <input type="text" className="input" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} required />
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label>Email (Không thể đổi)</label>
                  <input type="email" className="input" value={user?.email} disabled style={{ opacity: 0.6 }} />
                </div>
                {user?.role === 'STUDENT' && (
                  <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                    <label>Khối lớp</label>
                    <select className="input" value={accountForm.grade} onChange={e => setAccountForm({...accountForm, grade: e.target.value})} required>
                      <option value="">Chọn khối lớp</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={i+1}>Lớp {i+1}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              </form>
            )}

            {activeTab === 'settings' && (
              <div className="fade-in">
                <h3 style={{ marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>Cá nhân hóa giao diện</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-6)' }}>
                  Lựa chọn bộ màu sắc, chế độ sáng tối và hiệu ứng hoạt ảnh nền yêu thích. Cấu hình sẽ được lưu cho tài khoản của bạn.
                </p>
                
                {/* 1. Chế độ giao diện */}
                <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>1. Chế độ giao diện (Theme Mode)</label>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <input type="radio" name="theme" checked={settingsForm.theme === 'dark'} onChange={() => handlePreviewThemeMode('dark')} /> 🌙 Tối (Dark Mode - Mặc định)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <input type="radio" name="theme" checked={settingsForm.theme === 'light'} onChange={() => handlePreviewThemeMode('light')} /> ☀️ Sáng (Light Mode)
                    </label>
                  </div>
                </div>


                {/* 2. Màu sắc chủ đạo */}
                <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>2. Bộ màu sắc chủ đạo (Color Themes)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    {COLOR_THEMES.map(theme => {
                      const isSelected = settingsForm.colorTheme === theme.id && !settingsForm.primaryColor;
                      return (
                        <div 
                          key={theme.id}
                          onClick={() => handlePreviewColorTheme(theme.id)}
                          style={{
                            padding: 'var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)',
                            border: `2px solid ${isSelected ? theme.color : 'var(--border-subtle)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? `0 0 15px ${theme.color}40` : 'none'
                          }}
                        >
                          <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{theme.icon}</div>
                          <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', margin: '0 0 4px 0' }}>{theme.name}</h4>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>{theme.desc}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tùy chỉnh màu HEX */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>🎨 Hoặc tùy chỉnh màu HEX riêng của bạn:</span>
                    <input 
                      type="color" 
                      value={settingsForm.primaryColor || '#ea580c'} 
                      onChange={e => handlePreviewCustomColor(e.target.value)} 
                      style={{ width: 42, height: 36, padding: 0, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }} 
                    />
                    {settingsForm.primaryColor && (
                      <span className="badge badge-primary">{settingsForm.primaryColor}</span>
                    )}
                  </div>
                </div>

                {/* 3. Hoạt ảnh nền */}
                <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>3. Mẫu hiệu ứng nền động (Background Animation)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                    {ANIMATIONS.map(anim => {
                      const isSelected = settingsForm.animation === anim.id;
                      return (
                        <div 
                          key={anim.id}
                          onClick={() => setSettingsForm({ ...settingsForm, animation: anim.id })}
                          style={{
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-md)',
                            background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)',
                            border: `2px solid ${isSelected ? 'var(--clr-primary-400)' : 'var(--border-subtle)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? 'var(--shadow-glow-primary)' : 'none'
                          }}
                        >
                          <div style={{ fontSize: '1.4rem' }}>{anim.icon}</div>
                          <div style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {anim.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Cỡ chữ */}
                <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>4. Cỡ chữ hiển thị cơ bản</label>
                  <select className="input" value={settingsForm.fontSize} onChange={e => setSettingsForm({...settingsForm, fontSize: e.target.value})} style={{ maxWidth: 240 }}>
                    <option value="14px">Nhỏ (14px)</option>
                    <option value="16px">Vừa (16px - Mặc định)</option>
                    <option value="18px">Lớn (18px)</option>
                    <option value="20px">Rất lớn (20px)</option>
                  </select>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-5)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleSaveSettings} className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? 'Đang lưu cấu hình...' : '💾 Áp dụng & Lưu thay đổi'}
                  </button>
                </div>
              </div>
            )}


            {activeTab === 'password' && (
              <form onSubmit={handleUpdatePassword}>
                <h3 style={{ marginBottom: 'var(--space-5)', color: 'var(--text-primary)' }}>Đổi mật khẩu</h3>
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label>Mật khẩu hiện tại</label>
                  <input type="password" className="input" value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} required />
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label>Mật khẩu mới</label>
                  <input type="password" className="input" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} required minLength={6} />
                </div>
                <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                  <label>Nhập lại mật khẩu mới</label>
                  <input type="password" className="input" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} required minLength={6} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Đổi mật khẩu'}</button>
              </form>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
