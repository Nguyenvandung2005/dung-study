import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import LogoWaveBounce from '../components/ui/LogoWaveBounce';
import './AuthPage.css';


const ROLES = [
  { value: 'STUDENT', label: '🎓 Học sinh', desc: 'Làm bài kiểm tra, xem điểm' },
  { value: 'TEACHER', label: '👩‍🏫 Giáo viên', desc: 'Tạo bài kiểm tra, xem thống kê' },
];

const GRADES = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Lớp ${i + 1}` }));

const ImagePuzzle = () => {
  const cols = 10;
  const rows = 1;
  const pieces = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const xPos = cols > 1 ? (c / (cols - 1)) * 100 : 0;
      const yPos = 0;
      
      const randY = (Math.random() - 0.5) * 6;
      // Trượt vào tuần tự theo thứ tự cột từ PHẢI sang TRÁI
      const delay = (cols - 1 - c) * 0.1;

      pieces.push(
        <div
          key={`${r}-${c}`}
          className="puzzle-piece"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url('/bg-asian-art.png')`,
            backgroundSize: `cover`,
            backgroundPosition: `center`,
            backgroundRepeat: 'no-repeat',
            clipPath: `inset(0% ${100 - (c + 1) * (100 / cols)}% 0% ${c * (100 / cols)}%)`,
            '--rx': 0,
            '--ry': randY,
            '--rr': 0,
            animationDelay: `${delay}s`
          }}
        />
      );
    }
  }

  return (
    <div className="puzzle-container">
      {pieces}
    </div>
  );
};

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT', grade: 1 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, oauthLogin } = useAuth();
  const navigate = useNavigate();

  const handleOAuthSuccess = async (provider, credentials) => {
    setError('');
    setLoading(true);
    try {
      const user = await oauthLogin(provider, credentials, form.role, form.grade);
      const redirectUrl = localStorage.getItem('redirectUrl');
      if (redirectUrl) {
        localStorage.removeItem('redirectUrl');
        navigate(redirectUrl);
      } else {
        if (user.role === 'ADMIN') navigate('/admin');
        else if (user.role === 'TEACHER') navigate('/teacher');
        else navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || `Đăng ký ${provider} thất bại`);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => handleOAuthSuccess('google', { credential: codeResponse.access_token }),
    onError: (error) => setError('Đăng nhập Google thất bại'),
  });

  const handleFacebookLogin = () => {
    if (typeof window.FB === 'undefined') {
      setError('Facebook SDK chưa tải xong. Vui lòng thử lại sau vài giây.');
      return;
    }
    window.FB.login((response) => {
      if (response?.authResponse?.accessToken) {
        handleOAuthSuccess('facebook', { accessToken: response.authResponse.accessToken });
      } else {
        setError('Đăng ký Facebook bị huỷ hoặc thất bại.');
      }
    }, { scope: 'public_profile,email' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      const redirectUrl = localStorage.getItem('redirectUrl');
      if (redirectUrl) {
        localStorage.removeItem('redirectUrl');
        navigate(redirectUrl);
      } else {
        if (user.role === 'TEACHER') navigate('/teacher');
        else navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page-asian">
      {/* Register Form Pane (Left Side) */}
      <section className="auth-split-form anim-slide-left">
        <div className="auth-container" style={{ width: '100%', maxWidth: '440px', background: 'transparent' }}>
          <header className="auth-brand anim-stagger-1" style={{ marginBottom: '15px' }}>
            <div className="auth-logo" style={{ marginBottom: '12px' }}><LogoWaveBounce size="lg" /></div>
            <h1 className="auth-title">Dung-<span className="gradient-text">Study</span></h1>

            <p className="auth-subtitle">Tạo tài khoản học tập miễn phí</p>
          </header>

          <article className="glass-card auth-card anim-stagger-2" style={{ padding: '24px', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 className="auth-card-title" style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Đăng ký</h2>
            {error && <div className="auth-error"><span>⚠️</span> {error}</div>}

            <form onSubmit={handleSubmit} className="auth-form" style={{ gap: '16px' }}>
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
                <div className="role-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {ROLES.map(r => (
                    <button key={r.value} type="button"
                      className={`role-card ${form.role === r.value ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, role: r.value })}
                      style={{ padding: '10px', minHeight: 'auto' }}>
                      <span className="role-label" style={{ fontSize: '0.9rem' }}>{r.label}</span>
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

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '8px', width: '100%' }}>
                {loading ? <><span className="spinner" /> Đang tạo...</> : '✨ Tạo tài khoản'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0', color: 'var(--text-muted)' }}>
                <hr style={{ flex: 1, borderColor: 'var(--border-subtle)' }} />
                <span style={{ padding: '0 10px', fontSize: '0.9rem' }}>HOẶC ĐĂNG KÝ VỚI</span>
                <hr style={{ flex: 1, borderColor: 'var(--border-subtle)' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => googleLogin()} className="btn btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={loading}>
                  <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 18, height: 18 }} />
                  Google
                </button>

                <button type="button" onClick={handleFacebookLogin} className="btn btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={loading}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" style={{ width: 18, height: 18 }} />
                  Facebook
                </button>
              </div>
            </form>

            <p className="auth-link" style={{ marginTop: '20px' }}>
              Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
            </p>
          </article>
        </div>
      </section>

      {/* Background Image Pane (Puzzle Effect) (Right Side) */}
      <div className="auth-split-image fade-left">
        <ImagePuzzle />
      </div>

    </main>
  );
}
