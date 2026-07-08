import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = {
  STUDENT: [
    { to: '/student', icon: '🏠', label: 'Trang chủ' },
    { to: '/student/exams', icon: '📝', label: 'Bài kiểm tra' },
    { to: '/student/history', icon: '📊', label: 'Lịch sử' },
  ],
  TEACHER: [
    { to: '/teacher', icon: '🏠', label: 'Tổng quan' },
    { to: '/teacher/exams', icon: '📝', label: 'Bài kiểm tra' },
    { to: '/teacher/create', icon: '➕', label: 'Tạo bài mới' },
    { to: '/teacher/statistics', icon: '📊', label: 'Thống kê' },
    { to: '/teacher/grading', icon: '✏️', label: 'Chấm bài' },
  ],
  ADMIN: [
    { to: '/admin', icon: '🏠', label: 'Dashboard' },
    { to: '/admin/users', icon: '👥', label: 'Người dùng' },
    { to: '/admin/exams', icon: '📝', label: 'Bài kiểm tra' },
    { to: '/admin/security', icon: '🔒', label: 'Bảo mật' },
    { to: '/admin/animation', icon: '🎨', label: 'Giao diện (Theme)' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Set simulated role for Admin (defaults to ADMIN, can be simulated as TEACHER or STUDENT)
  const [simulatedRole, setSimulatedRole] = useState(() => {
    return localStorage.getItem('simulatedRole') || user?.role || 'STUDENT';
  });

  const handleLogout = () => {
    localStorage.removeItem('simulatedRole');
    logout();
    navigate('/login');
  };

  const handleSimulateRole = (role) => {
    setSimulatedRole(role);
    localStorage.setItem('simulatedRole', role);
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'TEACHER') navigate('/teacher');
    else navigate('/student');
  };

  // If user is Admin, use simulatedRole to choose navigation layout, else use default role
  const activeRole = user?.role === 'ADMIN' ? simulatedRole : (user?.role || 'STUDENT');
  const items = navItems[activeRole] || [];

  const content = (
    <>
      <div className="sidebar-brand">
        <img src="/logo.png" alt="Dung Study Logo" className="sidebar-logo" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)' }} />
        <span className="sidebar-brand-text">Dung-<span className="gradient-text">Study</span></span>
      </div>

      <div className="divider" />

      {/* Role simulator for admin */}
      {user?.role === 'ADMIN' && (
        <div className="glass-card" style={{ padding: '8px', marginBottom: '8px', border: '1px solid rgba(245,158,11,0.3)' }}>
          <p style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'bold', marginBottom: '4px', textAlign: 'center' }}>
            🛠️ MÔ PHỎNG VAI TRÒ
          </p>
          <select 
            value={simulatedRole} 
            onChange={e => handleSimulateRole(e.target.value)}
            className="input" 
            style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', color: '#f59e0b', border: '1px solid #f59e0b' }}
          >
            <option value="ADMIN" style={{ background: '#0a0a1e', color: '#fff' }}>🔑 Admin (Gốc)</option>
            <option value="TEACHER" style={{ background: '#0a0a1e', color: '#fff' }}>👩‍🏫 Giáo viên</option>
            <option value="STUDENT" style={{ background: '#0a0a1e', color: '#fff' }}>🎓 Học sinh</option>
          </select>
        </div>
      )}

      <div className="sidebar-user">
        <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.name}</span>
          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
            {user?.role === 'ADMIN' ? `Admin (${activeRole})` : user?.role === 'TEACHER' ? 'Giáo viên' : `Lớp ${user?.grade}`}
          </span>
        </div>
      </div>

      <div className="divider" />

      <nav className="sidebar-nav">
        {items.map(item => (
          <Link key={item.to} to={item.to} className={`sidebar-nav-item ${location.pathname === item.to ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }} onClick={handleLogout}>
          <span>🚪</span> Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} id="mobile-menu-toggle">
        ☰
      </button>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>{content}</aside>
    </>
  );
}
