import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getFullUploadUrl } from '../../api/client';
import {
  House,
  ClipboardText,
  ChartBar,
  Trophy,
  PlusCircle,
  PencilSimple,
  Users,
  Lock,
  Palette,
  SignOut,
  Wrench,
  UserCircle,
  CaretDown,
} from '@phosphor-icons/react';
import LogoWaveBounce from './LogoWaveBounce';
import './Sidebar.css';


const navItems = {
  STUDENT: [
    { to: '/student', icon: House, label: 'Trang chủ' },
    { to: '/student/exams', icon: ClipboardText, label: 'Bài kiểm tra' },
    { to: '/student/history', icon: ChartBar, label: 'Lịch sử' },
    { to: '/student/leaderboard', icon: Trophy, label: 'Bảng xếp hạng' },
  ],
  TEACHER: [
    { to: '/teacher', icon: House, label: 'Tổng quan' },
    { to: '/teacher/exams', icon: ClipboardText, label: 'Bài kiểm tra' },
    { to: '/teacher/create', icon: PlusCircle, label: 'Tạo bài mới' },
    { to: '/teacher/statistics', icon: ChartBar, label: 'Thống kê' },
    { to: '/teacher/grading', icon: PencilSimple, label: 'Chấm bài' },
  ],
  ADMIN: [
    { to: '/admin', icon: House, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Người dùng' },
    { to: '/admin/exams', icon: ClipboardText, label: 'Bài kiểm tra' },
    { to: '/admin/security', icon: Lock, label: 'Bảo mật' },
    { to: '/admin/animation', icon: Palette, label: 'Giao diện' },
  ],
};

const roleLabels = {
  ADMIN: { label: 'Admin', icon: Wrench },
  TEACHER: { label: 'Giáo viên', icon: PencilSimple },
  STUDENT: { label: 'Học sinh', icon: UserCircle },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  const [simulatedRole, setSimulatedRole] = useState(() => {
    return localStorage.getItem('simulatedRole') || user?.role || 'STUDENT';
  });

  const handleLogout = () => {
    localStorage.removeItem('simulatedRole');
    logout();
    navigate('/');
  };

  const handleSimulateRole = (role) => {
    setSimulatedRole(role);
    localStorage.setItem('simulatedRole', role);
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'TEACHER') navigate('/teacher');
    else navigate('/student');
  };

  const activeRole = user?.role === 'ADMIN' ? simulatedRole : (user?.role || 'STUDENT');
  const items = navItems[activeRole] || [];

  const content = (
    <>
      <div className="sidebar-brand">
        <LogoWaveBounce size="sm" />
        <span className="sidebar-brand-text">Dung-Study</span>
      </div>

      <div className="sidebar-divider" />

      {/* Role simulator for admin (Minimal Dropdown) */}
      {user?.role === 'ADMIN' && (
        <div className="role-sim-minimal">
          <div className="icon-wrap">
            <Wrench size={16} weight="duotone" />
          </div>
          <select 
            value={simulatedRole} 
            onChange={e => handleSimulateRole(e.target.value)}
            className="role-sim-select"
          >
            <option value="ADMIN">Admin Mode</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="STUDENT">Học sinh</option>
          </select>
          <CaretDown size={14} weight="bold" className="role-sim-caret" />
        </div>
      )}

      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.avatar && !avatarError ? (
            <img 
              src={getFullUploadUrl(user.avatar)} 
              alt={user.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
              onError={() => setAvatarError(true)}
            />
          ) : (
            user?.name?.[0]?.toUpperCase()
          )}
        </div>
        <div className="sidebar-user-info">
          <Link to="/profile" className="sidebar-user-name">
            {user?.name}
          </Link>
          <span className="sidebar-user-role">
            {user?.role === 'ADMIN' 
              ? `Hệ thống gốc` 
              : user?.role === 'TEACHER' 
                ? 'Giáo viên' 
                : `Lớp ${user?.grade}`}
          </span>
        </div>
      </div>

      <div className="sidebar-divider" />

      <nav className="sidebar-nav">
        {items.map(item => {
          const IconComp = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-nav-item glow-border ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon-wrap">
                <IconComp size={18} weight={isActive ? 'fill' : 'duotone'} />
              </span>
              <span className="nav-label">{item.label}</span>
              {isActive && <span className="nav-active-dot" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <SignOut size={18} weight="regular" />
          <span>Đăng xuất hệ thống</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} id="mobile-menu-toggle">
        <svg width="20" height="14" viewBox="0 0 18 14" fill="none">
          <path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar-island glow-border-rainbow ${mobileOpen ? 'open' : ''}`}>
        {content}
      </aside>
    </>
  );
}
