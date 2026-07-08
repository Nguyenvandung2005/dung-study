import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import './AuthPage.css';

const ROLES = [
  { value: 'STUDENT', label: '🎓 Học sinh', desc: 'Làm bài kiểm tra, xem điểm' },
  { value: 'TEACHER', label: '👩‍🏫 Giáo viên', desc: 'Tạo bài kiểm tra, xem thống kê' },
];

const GRADES = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Lớp ${i + 1}` }));

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT', grade: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      if (user.role === 'TEACHER') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AnimatedBackground />
      <div className="auth-container fade-in" style={{ maxWidth: 480 }}>
        <div className="auth-brand">
          <div className="auth-logo">📚</div>
          <h1 className="auth-title">Dung-<span className="gradient-text">Study</span></h1>
          <p className="auth-subtitle">Tạo tài khoản miễn phí</p>
        </div>

        <div className="glass-card auth-card">
          <h2 className="auth-card-title">Đăng ký</h2>
          {error && <div className="auth-error"><span>⚠️</span> {error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label">Họ và tên</label>
              <input type="text" className="input" placeholder="Nguyễn Văn A"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input type="email" className="input" placeholder="email@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Mật khẩu</label>
              <input type="password" className="input" placeholder="Ít nhất 6 ký tự"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            {/* Role selector */}
            <div className="input-group">
              <label className="input-label">Vai trò</label>
              <div className="role-grid">
                {ROLES.map(r => (
                  <button key={r.value} type="button"
                    className={`role-card ${form.role === r.value ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, role: r.value })}>
                    <span className="role-label">{r.label}</span>
                    <span className="role-desc">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grade selector for students */}
            {form.role === 'STUDENT' && (
              <div className="input-group fade-in">
                <label className="input-label">Khối lớp</label>
                <select className="input" value={form.grade} onChange={e => setForm({ ...form, grade: parseInt(e.target.value) })}>
                  {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="register-submit-btn">
              {loading ? <><span className="spinner" /> Đang tạo tài khoản...</> : '✨ Tạo tài khoản'}
            </button>
          </form>

          <p className="auth-link">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
