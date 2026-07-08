import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import './LandingPage.css';

const FEATURES = [
  { icon: '📝', title: 'Đa dạng hình thức kiểm tra', desc: 'Trắc nghiệm đơn, trắc nghiệm nhiều đáp án, tự luận (AI chấm tự động)' },
  { icon: '⏱️', title: 'Theo dõi thời gian từng câu', desc: 'Phát hiện học sinh chọn đại — ghi nhận thời gian dừng lại ở mỗi câu hỏi' },
  { icon: '📊', title: 'Thống kê chi tiết', desc: 'Biểu đồ phân bố điểm, thời gian làm bài, tỉ lệ đúng từng câu' },
  { icon: '🤖', title: 'AI chấm tự luận', desc: 'Gemini AI tự động chấm câu tự luận, giáo viên có thể chỉnh sửa' },
  { icon: '📄', title: 'Import từ Word & PDF', desc: 'Tải lên file kiểm tra có sẵn, hệ thống tự động nhận diện câu hỏi' },
  { icon: '🔒', title: 'Bảo mật thông minh', desc: 'Phát hiện đăng nhập bất thường, chặn brute-force, cảnh báo real-time' },
];

const GRADES_DISPLAY = [
  { range: '1 - 5', label: 'Tiểu học', color: '#10b981', emoji: '🌱' },
  { range: '6 - 9', label: 'THCS', color: '#6366f1', emoji: '📗' },
  { range: '10 - 12', label: 'THPT', color: '#f59e0b', emoji: '🎓' },
];

export default function LandingPage() {
  const { user } = useAuth();
  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }

  return (
    <div className="landing">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="landing-header glass-card">
        <div className="header-brand">
          <img src="/logo.png" alt="Dung-Study" className="header-logo" style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)' }} />
          <span className="header-name">Dung-<span className="gradient-text">Study</span></span>
        </div>
        <div className="header-actions">
          <Link to="/login" className="btn btn-outline">Đăng nhập</Link>
          <Link to="/register" className="btn btn-primary">Bắt đầu miễn phí</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge badge-primary">✨ Nền tảng kiểm tra K1-K12</span>
        </div>
        <h1 className="hero-title">
          Kiểm tra thông minh<br />
          <span className="gradient-text">Học tập hiệu quả</span>
        </h1>
        <p className="hero-desc">
          Hệ thống kiểm tra trực tuyến hiện đại cho toàn bộ cấp học.
          Giáo viên tạo đề dễ dàng — Học sinh làm bài, nhận điểm ngay lập tức.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg" id="hero-cta-register">
            🚀 Bắt đầu ngay — Miễn phí
          </Link>
          <Link to="/login" className="btn btn-outline btn-lg">
            Đăng nhập
          </Link>
        </div>

        {/* Grade pills */}
        <div className="grade-pills">
          {GRADES_DISPLAY.map(g => (
            <div key={g.range} className="grade-pill" style={{ '--pill-color': g.color }}>
              <span>{g.emoji}</span>
              <span>Lớp {g.range}</span>
              <span className="grade-pill-label">{g.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2 className="section-title">Tính năng nổi bật</h2>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card glass-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card glass-card">
          <h2>Sẵn sàng bắt đầu?</h2>
          <p>Tạo tài khoản miễn phí và trải nghiệm ngay hôm nay.</p>
          <Link to="/register" className="btn btn-primary btn-lg" id="footer-cta-register">
            ✨ Tạo tài khoản miễn phí
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 Dung-Study — Phát triển bởi Nguyễn Văn Dũng</p>
      </footer>
    </div>
  );
}
