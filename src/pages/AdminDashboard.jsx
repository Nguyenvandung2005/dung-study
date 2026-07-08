import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import api from '../api/client';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { themes, activeTheme, setActiveTheme } = useTheme();

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleApplyTheme = async (themeId) => {
    try {
      const { data } = await api.put('/admin/animation-themes/active', { themeId });
      setActiveTheme(data.theme);
      alert(`Đã áp dụng animation: ${data.theme.displayName}`);
    } catch (e) {
      alert('Không thể áp dụng theme');
    }
  };

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content">
        <div className="page-header fade-in">
          <div>
            <h1 className="page-title">Quản trị hệ thống <span className="gradient-text">Admin</span> 👨‍💼</h1>
            <p className="page-subtitle">Giám sát bảo mật, quản lý hiệu ứng animation và hệ thống.</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>Đang tải dữ liệu admin...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="stats-grid fade-in">
              <div className="stat-card glass-card">
                <span className="stat-icon">👥</span>
                <span className="stat-value">{data?.totalUsers || 0}</span>
                <span className="stat-label">Tổng người dùng</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-icon">📝</span>
                <span className="stat-value">{data?.totalExams || 0}</span>
                <span className="stat-label">Bài kiểm tra</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-icon">📥</span>
                <span className="stat-value">{data?.totalSubmissions || 0}</span>
                <span className="stat-label">Lượt thi</span>
              </div>
              <div className="stat-card glass-card" style={{ borderColor: 'rgba(244,63,94,0.4)' }}>
                <span className="stat-icon">🚨</span>
                <span className="stat-value" style={{ color: 'var(--clr-rose-500)' }}>
                  {data?.criticalLogs || 0}
                </span>
                <span className="stat-label">Sự cố bảo mật (24h)</span>
              </div>
            </div>

            {/* Animation Manager & Security Logs */}
            <div className="admin-grid fade-in">
              {/* Animation Theme CTA */}
              <div className="glass-card admin-section">
                <h2 className="section-title-left">🎨 Cấu hình Giao diện (Theme)</h2>
                <p className="section-desc">Phân hệ quản lý giao diện đã được nâng cấp với tính năng phối màu và hiệu ứng động toàn diện.</p>
                
                <div style={{ padding: 'var(--space-6)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', textAlign: 'center', marginTop: 'var(--space-4)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>✨</div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Tạo ra hơn 36 tổ hợp giao diện</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', fontSize: '0.9rem' }}>
                    Kết hợp linh hoạt giữa 6 Màu sắc chủ đạo (Cyberpunk, Abyss Blue...) và 5 Hoạt ảnh động (Ma trận, Bụi sao...) để tạo ra trải nghiệm độc nhất.
                  </p>
                  
                  <Link to="/admin/animation" className="btn btn-primary">
                    Truy cập Trình Cấu hình Giao diện ➜
                  </Link>
                </div>
              </div>

              {/* Recent Security Logs */}
              <div className="glass-card admin-section">
                <h2 className="section-title-left">🔒 Log hoạt động bảo mật</h2>
                <div className="logs-container">
                  {data?.recentLogs?.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Chưa có log bảo mật nào.</p>
                  ) : (
                    data?.recentLogs?.map(log => (
                      <div key={log.id} className={`log-item severity-${log.severity.toLowerCase()}`}>
                        <div className="log-header">
                          <span className="log-time">{new Date(log.createdAt).toLocaleTimeString()}</span>
                          <span className={`badge ${log.severity === 'CRITICAL' || log.severity === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>
                            {log.action}
                          </span>
                        </div>
                        <p className="log-details">
                          IP: <strong>{log.ip}</strong> • User: {log.user?.name || 'Khách'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
