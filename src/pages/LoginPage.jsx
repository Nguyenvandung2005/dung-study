import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render.props';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import LogoWaveBounce from '../components/ui/LogoWaveBounce';
import './AuthPage.css';


const ImagePuzzle = () => {
  const cols = 10;
  const rows = 1;
  const pieces = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const xPos = cols > 1 ? (c / (cols - 1)) * 100 : 0;
      const yPos = 0;
      
      // Chỉ dịch chuyển theo trục Y để tạo hiệu ứng rèm sập mượt mà
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

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, oauthLogin } = useAuth();
  const navigate = useNavigate();

  const handleOAuthSuccess = async (provider, credentials) => {
    setError('');
    setLoading(true);
    try {
      const user = await oauthLogin(provider, credentials);
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
      setError(err.response?.data?.message || `Đăng nhập ${provider} thất bại`);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => handleOAuthSuccess('google', { credential: codeResponse.access_token }),
    onError: (error) => setError('Đăng nhập Google thất bại'),
  });

  const handleFacebookCallback = (response) => {
    if (response?.accessToken) {
      handleOAuthSuccess('facebook', { accessToken: response.accessToken });
    } else {
      setError('Đăng nhập Facebook thất bại');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
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
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page-asian">
      {/* Background Image Pane (Puzzle Effect) */}
      <div className="auth-split-image fade-right">
        <ImagePuzzle />
      </div>


      {/* Login Form Pane */}
      <section className="auth-split-form anim-slide-right">
        <div className="auth-container" style={{ width: '100%', maxWidth: '440px', background: 'transparent' }}>
          <header className="auth-brand anim-stagger-1" style={{ marginBottom: '20px' }}>
            <div className="auth-logo" style={{ marginBottom: '12px' }}><LogoWaveBounce size="lg" /></div>
            <h1 className="auth-title">Dung-<span className="gradient-text">Study</span></h1>

            <p className="auth-subtitle">Nền tảng học tập & kiểm tra K1–K12</p>
          </header>

          <article className="glass-card auth-card anim-stagger-2" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
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
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="login-submit-btn" style={{ width: '100%', marginBottom: '16px' }}>
                {loading ? <><span className="spinner" /> Đang đăng nhập...</> : '🚀 Đăng nhập'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', color: 'var(--text-muted)' }}>
                <hr style={{ flex: 1, borderColor: 'var(--border-subtle)' }} />
                <span style={{ padding: '0 10px', fontSize: '0.9rem' }}>HOẶC ĐĂNG NHẬP VỚI</span>
                <hr style={{ flex: 1, borderColor: 'var(--border-subtle)' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => googleLogin()} className="btn btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={loading}>
                  <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 18, height: 18 }} />
                  Google
                </button>

                <FacebookLogin
                  appId={import.meta.env.VITE_FACEBOOK_APP_ID || 'dummy-app-id'}
                  autoLoad={false}
                  fields="name,email,picture"
                  callback={handleFacebookCallback}
                  render={renderProps => (
                    <button type="button" onClick={renderProps.onClick} className="btn btn-outline" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={loading}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" style={{ width: 18, height: 18 }} />
                      Facebook
                    </button>
                  )}
                />
              </div>
            </form>
            <p className="auth-link anim-stagger-3">
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
