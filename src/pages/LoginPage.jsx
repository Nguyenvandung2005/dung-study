import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import './AuthPage.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'TEACHER') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AnimatedBackground />
      <div className="auth-container fade-in">
        <div className="auth-brand">
          <div className="auth-logo">📚</div>
          <h1 className="auth-title">Dung-<span className="gradient-text">Study</span></h1>
          <p className="auth-subtitle">Nền tảng học tập & kiểm tra K1–K12</p>
        </div>

        <div className="glass-card auth-card">
          <h2 className="auth-card-title">Đăng nhập</h2>
          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label" htmlFor="login-email">Email</label>
              <input id="login-email" type="email" className="input" placeholder="email@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="login-password">Mật khẩu</label>
              <input id="login-password" type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="login-submit-btn">
              {loading ? <><span className="spinner" /> Đang đăng nhập...</> : '🚀 Đăng nhập'}
            </button>
          </form>
          <p className="auth-link">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
