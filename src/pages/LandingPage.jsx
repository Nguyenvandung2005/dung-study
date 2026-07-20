import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoWaveBounce from '../components/ui/LogoWaveBounce';
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sun,
  Moon,
  Zap,
  Layers,
  Clock,
  Star,
  Mail,
  Phone,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import './LandingPage.css';

const ScrollTypingText = ({ text, className = "" }) => {
  const elRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!elRef.current) return;
      const rect = elRef.current.getBoundingClientRect();
      const startY = window.innerHeight * 0.9;
      const endY = window.innerHeight * 0.1;
      const currentProgress = (startY - rect.top) / (startY - endY);
      setProgress(Math.max(0, Math.min(1, currentProgress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const chars = text.split('');
  const activeCount = Math.floor(progress * chars.length);

  return (
    <span ref={elRef} className={`scroll-typing-text ${className}`}>
      {chars.map((char, idx) => (
        <span
          key={idx}
          className={`char-span ${idx <= activeCount ? 'active' : ''}`}
        >
          {char}
        </span>
      ))}
    </span>
  );
};

const InteractiveBuilding = ({ src, alt, themeMode, className = "" }) => {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const isNight = themeMode === 'night' || themeMode === 'aura';

  return (
    <div
      ref={containerRef}
      className={`interactive-building-wrap ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative', overflow: 'hidden', cursor: 'crosshair', width: '100%' }}
    >
      {/* Base Layer */}
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: 'inherit',
          objectFit: 'cover',
          display: 'block',
          filter: isNight ? 'none' : 'grayscale(0.7) brightness(1.4) sepia(0.2) contrast(0.9)',
          transition: 'filter 0.5s ease'
        }}
      />

      {/* Hover Spotlight Overlay Layer (Reversed state) */}
      <img
        src={src}
        alt={alt}
        style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          filter: isNight ? 'grayscale(0.7) brightness(1.4) sepia(0.2) contrast(0.9)' : 'none',
          clipPath: isHovered
            ? `circle(120px at ${mousePos.x}px ${mousePos.y}px)`
            : `circle(0px at 0px 0px)`,
          transition: isHovered ? 'none' : 'clip-path 0.4s ease-out',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

const FEATURED_COURSES = [
  {
    id: 1,
    title: 'Bộ Đề Thi Thử THPT Quốc Gia 2026',
    location: 'Toán, Lý, Hóa, Anh - K12 Special',
    price: 'MIỄN PHÍ',
    image: '/images/course_smart_prep.png',
    stats: { questions: '1,200+ Câu', attempts: '45,820 Lượt thi', rating: '4.95 ★' },
    badge: 'BÀI THI HOT',
    desc: 'Ma trận đề thi bám sát định hướng của Bộ GD&ĐT. Hệ thống tự động chấm điểm và gợi ý đáp án chi tiết tức thì.'
  },
  {
    id: 2,
    title: 'Chuyên Đề AI & Lập Trình Tư Duy',
    location: 'Dành cho Học Sinh THCS & THPT',
    price: 'ĐỀ NỔI BẬT',
    image: '/images/course_ai_grading.png',
    stats: { questions: '850+ Câu', attempts: '28,400 Lượt thi', rating: '4.98 ★' },
    badge: 'CÔNG NGHỆ AI',
    desc: 'Kiểm tra kiến thức lập trình & tư duy logic với AI tự động phân tích độ tối ưu của mã nguồn và thuật toán.'
  },
  {
    id: 3,
    title: 'Ngân Hàng Đề Thi Đánh Giá Năng Lực',
    location: 'ĐHQG & ĐH Bách Khoa 2026',
    price: 'MIỄN PHÍ',
    image: '/images/course_mentorship.png',
    stats: { questions: '2,500+ Câu', attempts: '62,100 Lượt thi', rating: '5.0 ★' },
    badge: 'TOP ĐÁNH GIÁ',
    desc: 'Phân loại năng lực toàn diện qua 3 phần: Ngôn ngữ, Toán học & Tư duy logic, Giải quyết vấn đề.'
  },
  {
    id: 4,
    title: 'Hệ Thống Luyện Thi Học Sinh Giỏi',
    location: 'Cấp Thành Phố & Quốc Gia',
    price: 'CHUYÊN SÂU',
    image: '/images/hero_study_cathedral.png',
    stats: { questions: '950+ Câu', attempts: '19,300 Lượt thi', rating: '4.92 ★' },
    badge: 'CHUYÊN SÂU',
    desc: 'Tự luận nâng cao được hỗ trợ bởi Gemini AI chấm điểm tự động, chỉ ra lỗ hổng kiến thức chính xác.'
  }
];

const JOURNAL_ARTICLES = [
  {
    id: 1,
    title: '5 Phương Pháp Ghi Nhớ Sâu Khi Ôn Thi Trắc Nghiệm',
    excerpt: 'Bí quyết tối ưu thời gian ôn tập và tăng khả năng ghi nhớ cho các kỳ thi chuẩn hóa bằng phương pháp lặp lại ngắt quãng.',
    readTime: '5 MIN READ',
    category: 'Kinh Nghiệm Học Tập',
    image: '/images/journal_study_tips.png'
  },
  {
    id: 2,
    title: 'Cách Phân Bố Thời Gian Làm Bài Thi Hiệu Quả',
    excerpt: 'Phát hiện câu hỏi bẫy, kiểm soát áp lực thời gian và tối ưu từng điểm số trong phòng thi trắc nghiệm.',
    readTime: '4 MIN READ',
    category: 'Bí Quyết Phòng Thi',
    image: '/images/journal_exam_prep.png'
  },
  {
    id: 3,
    title: 'Ứng Dụng Gemini AI Trong Chấm Điểm Tự Luận',
    excerpt: 'Khám phá cách công nghệ AI giúp tự động hóa quá trình chấm thi, đảm bảo sự minh bạch và phản hồi tức thì.',
    readTime: '6 MIN READ',
    category: 'Công Nghệ Giáo Dục',
    image: '/images/journal_ai_education.png'
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  const [themeMode, setThemeMode] = useState('night'); // 'night', 'day', 'aura'
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    document.documentElement.classList.remove('light-theme', 'aura-theme');
    document.body.classList.remove('light-theme', 'aura-theme');

    if (themeMode === 'day') {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme');
    } else if (themeMode === 'aura') {
      document.documentElement.classList.add('aura-theme');
      document.body.classList.add('aura-theme');
    }
  }, [themeMode]);

  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % FEATURED_COURSES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + FEATURED_COURSES.length) % FEATURED_COURSES.length);
  };

  const currentCourse = FEATURED_COURSES[currentSlideIndex];

  return (
    <main className={`landing-v2 theme-${themeMode}`}>
      {/* Fixed Fullscreen Background Image & Progressive Blur Overlay */}
      <div className="v2-page-bg">
        <div className="v2-bg-image" />
        <div className="v2-bg-overlay" />
      </div>

      {/* Dynamic Background Glows */}
      <div className="bg-glow-orb glow-1" />
      <div className="bg-glow-orb glow-2" />
      <div className="bg-grid-overlay" />

      {/* Sticky Top Header Navigation */}
      <header className="navbar-v2">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <LogoWaveBounce size="sm" />
            <span className="brand-title">
              Dung<span className="gold-accent">Study</span>
            </span>
          </Link>

          <nav className="nav-links">
            <Link to="/" className="nav-link active">Trang chủ</Link>
            <Link to="/about" className="nav-link">Về chúng tôi</Link>
            <Link to="/architecture" className="nav-link">Cấu trúc hệ thống</Link>
            <a href="#featured-courses" className="nav-link">Kho đề thi</a>
            <a href="#journal" className="nav-link">Góc tri thức</a>
          </nav>

          <div className="nav-actions">
            <Link to="/login" className="btn-v2 btn-ghost">Đăng nhập</Link>
            <Link to="/register" className="btn-v2 btn-gold">Bắt đầu ngay</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-v2">
        <div className="hero-content">
          <div className="hero-pill-badge">
            <Sparkles size={16} className="gold-icon" />
            <span>Nền tảng kiểm tra K1-K12 ứng dụng Trí Tuệ Nhân Tạo</span>
          </div>

          <h1 className="hero-heading">
            <ScrollTypingText text="Khám phá " />
            <span className="serif-highlight">
              <ScrollTypingText text="tri thức" />
            </span>
            <ScrollTypingText text=", nâng tầm " />
            <span className="serif-highlight">
              <ScrollTypingText text="tương lai" />
            </span>
            <ScrollTypingText text=" cùng DungStudy." />
          </h1>

          <p className="hero-subtext">
            <ScrollTypingText text="Hệ thống kiểm tra & học tập trực tuyến chuẩn quốc tế. Tự động tạo bài kiểm tra, chấm bài thông minh bằng AI và phân tích năng lực chi tiết cho từng học sinh." />
          </p>

          <div className="hero-cta-group">
            <Link to="/register" className="btn-v2 btn-gold btn-hero">
              <span>Khám phá đề thi</span>
              <ArrowRight size={18} />
            </Link>
            <a href="#contact" className="btn-v2 btn-outline-gold btn-hero">
              <span>Đặt lịch tư vấn</span>
            </a>
          </div>
        </div>

        {/* Hero Showcase Image */}
        <div className="hero-showcase-container">
          <div className="showcase-frame">
            <InteractiveBuilding
              src="/images/hero_study_cathedral.png"
              alt="DungStudy Academic Cathedral Sanctuary"
              themeMode={themeMode}
              className="showcase-img"
            />
            <div className="showcase-glass-badge">
              <GraduationCap size={20} className="gold-icon" />
              <div>
                <span className="badge-title">Viện Hàn Lâm & Học Tập</span>
                <span className="badge-sub">Định hướng tri thức chuẩn mực</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Theme Control Widget (Matching Reference Video) */}
      <div className="floating-theme-widget">
        <span className="widget-label">Chế độ xem:</span>
        <button
          className={`theme-btn ${themeMode === 'night' ? 'active' : ''}`}
          onClick={() => setThemeMode('night')}
          title="Giao diện Ban Đêm (Luxury Dark)"
        >
          <Moon size={15} />
          <span>Night</span>
        </button>
        <button
          className={`theme-btn ${themeMode === 'day' ? 'active' : ''}`}
          onClick={() => setThemeMode('day')}
          title="Giao diện Ban Ngày (Light Mode)"
        >
          <Sun size={15} />
          <span>Day</span>
        </button>
        <button
          className={`theme-btn ${themeMode === 'aura' ? 'active' : ''}`}
          onClick={() => setThemeMode('aura')}
          title="Giao diện Aura Cyber"
        >
          <Zap size={15} />
          <span>Aura</span>
        </button>
      </div>

      {/* Section 2: About DungStudy (2-Column with Blueprint Wireframe) */}
      <section className="about-preview-v2">
        <div className="about-grid">
          <div className="about-info-col">
            <div className="section-tag">VỀ DŨNG STUDY</div>
            <h2 className="about-heading">
              <ScrollTypingText text="Nơi kết nối tri thức chuẩn mực & công nghệ tương lai." />
            </h2>
            <p className="about-paragraph">
              <ScrollTypingText text="DungStudy không chỉ dừng lại ở việc tạo câu hỏi trắc nghiệm. Chúng tôi kết hợp tinh thần tôn vinh tri thức, đạo đức học đường cùng sức mạnh của Gemini AI để xây dựng hệ thống kiểm tra minh bạch, công bằng và hiệu quả cao nhất." />
            </p>
            <p className="about-paragraph">
              <ScrollTypingText text="Từ quy trình bảo mật anti-cheat thời gian thực đến phân tích độ khó câu hỏi, mọi thành phần đều được thiết kế tỉ mỉ nhằm giúp giáo viên tiết kiệm 80% thời gian." />
            </p>
            <Link to="/about" className="btn-v2 btn-gold btn-about">
              <span>Khám phá câu chuyện</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="about-visual-col">
            <div className="wireframe-card">
              <InteractiveBuilding
                src="/images/about_wireframe_cathedral.png"
                alt="Cathedral Blueprint Wireframe"
                themeMode={themeMode}
                className="wireframe-img"
              />
              <div className="wireframe-overlay">
                <span className="wireframe-tag">ARCHITECTURAL BLUEPRINT</span>
                <span className="wireframe-title">Cấu Trúc Hệ Thống Chuẩn SEO & AI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: What We Offer ("Dịch Vụ & Ngành Học" with organic blob images) */}
      <section className="services-v2">
        <div className="section-header-center">
          <div className="section-tag">CHÚNG TÔI MANG ĐẾN</div>
          <h2 className="section-title-v2">
            <ScrollTypingText text="Giải Pháp Kiểm Tra & Đánh Giá Toàn Diện" />
          </h2>
          <p className="section-subtext">
            <ScrollTypingText text="Được thiết kế tối ưu cho Học sinh, Giáo viên và Nhà trường." />
          </p>
        </div>

        <div className="services-stack">
          {/* Service Item 1 */}
          <div className="service-card-row">
            <div className="service-img-wrapper blob-shape-1">
              <img src="/images/course_ai_grading.png" alt="AI Grading & Smart Exams" />
            </div>
            <div className="service-text-wrapper">
              <span className="service-role-badge">FOR STUDENTS & TEACHERS</span>
              <h3 className="service-title">
                <ScrollTypingText text="Kiểm Tra & Chấm Điểm AI Tự Động" />
              </h3>
              <p className="service-desc">
                <ScrollTypingText text="Hệ thống nhận diện câu hỏi trắc nghiệm, tự luận và tự động chấm điểm với độ chính xác tuyệt đối. Phân tích chi tiết lỗi sai và đề xuất bài tập khắc phục ngay lập tức." />
              </p>
              <ul className="service-bullets">
                <li><CheckCircle2 size={16} className="gold-icon" /> Chấm điểm trắc nghiệm & tự luận bằng AI</li>
                <li><CheckCircle2 size={16} className="gold-icon" /> Phân tích ma trận độ khó từng câu</li>
                <li><CheckCircle2 size={16} className="gold-icon" /> Báo cáo trực quan kết quả tức thì</li>
              </ul>
            </div>
          </div>

          {/* Service Item 2 */}
          <div className="service-card-row reverse">
            <div className="service-img-wrapper blob-shape-2">
              <img src="/images/course_smart_prep.png" alt="Tutoring and Preparation" />
            </div>
            <div className="service-text-wrapper">
              <span className="service-role-badge">FOR EXAM PREPARATION</span>
              <h3 className="service-title">
                <ScrollTypingText text="Luyện Thi & Ngân Hàng Đề Đa Dạng" />
              </h3>
              <p className="service-desc">
                <ScrollTypingText text="Tích hợp hàng chục ngàn câu hỏi chuẩn hóa từ Lớp 1 đến Lớp 12, hỗ trợ nhập đề thông minh từ file Word/PDF và theo dõi thời gian dừng lại ở từng câu hỏi." />
              </p>
              <ul className="service-bullets">
                <li><CheckCircle2 size={16} className="gold-icon" /> Import đề nhanh chóng từ file `.docx` & `.pdf`</li>
                <li><CheckCircle2 size={16} className="gold-icon" /> Ghi nhận thời gian làm bài chính xác từng giây</li>
                <li><CheckCircle2 size={16} className="gold-icon" /> Chống gian lận với hệ thống Anti-cheat</li>
              </ul>
            </div>
          </div>

          {/* Service Item 3 */}
          <div className="service-card-row">
            <div className="service-img-wrapper blob-shape-3">
              <img src="/images/course_mentorship.png" alt="Mentorship & Guidance" />
            </div>
            <div className="service-text-wrapper">
              <span className="service-role-badge">FOR MENTORSHIP & GOALS</span>
              <h3 className="service-title">
                <ScrollTypingText text="Định Hướng Năng Lực & Đột Phá Điểm Số" />
              </h3>
              <p className="service-desc">
                <ScrollTypingText text="Đồng hành cùng sĩ tử trong các kỳ thi chuyển cấp, THPT Quốc Gia và Đánh giá năng lực. Đưa ra sơ đồ tiến trình học tập cá nhân hóa rõ ràng." />
              </p>
              <ul className="service-bullets">
                <li><CheckCircle2 size={16} className="gold-icon" /> Bảng xếp hạng thi đua toàn hệ thống</li>
                <li><CheckCircle2 size={16} className="gold-icon" /> Đánh giá điểm mạnh/yếu theo từng chuyên đề</li>
                <li><CheckCircle2 size={16} className="gold-icon" /> Cảnh báo rủi ro học tập real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Featured Courses & Exam Suites ("Current Listings" in video) */}
      <section className="featured-v2" id="featured-courses">
        <div className="featured-top-bar">
          <div>
            <div className="section-tag">KHO ĐỀ THI NỔI BẬT</div>
            <h2 className="section-title-v2">
              <ScrollTypingText text="Các Bộ Đề Thi & Khóa Học Mới Nhất" />
            </h2>
          </div>

          {/* Pagination Controls Slider (Matching Video) */}
          <div className="slider-controls">
            <button className="slider-btn" onClick={handlePrevSlide} title="Trước">
              <ChevronLeft size={20} />
            </button>
            <span className="slider-counter">
              0{currentSlideIndex + 1} / 0{FEATURED_COURSES.length}
            </span>
            <button className="slider-btn" onClick={handleNextSlide} title="Sau">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Featured Card Spotlight */}
        <div className="featured-spotlight-card">
          <div className="spotlight-image-container">
            <img src={currentCourse.image} alt={currentCourse.title} className="spotlight-img" />
            <span className="spotlight-badge">{currentCourse.badge}</span>
          </div>

          <div className="spotlight-details">
            <span className="spotlight-location">{currentCourse.location}</span>
            <h3 className="spotlight-title">{currentCourse.title}</h3>

            <div className="spotlight-price">{currentCourse.price}</div>

            <div className="spotlight-meta-grid">
              <div className="meta-item">
                <BookOpen size={16} className="gold-icon" />
                <span>{currentCourse.stats.questions}</span>
              </div>
              <div className="meta-item">
                <Layers size={16} className="gold-icon" />
                <span>{currentCourse.stats.attempts}</span>
              </div>
              <div className="meta-item">
                <Star size={16} className="gold-icon" />
                <span>{currentCourse.stats.rating}</span>
              </div>
            </div>

            <p className="spotlight-desc">{currentCourse.desc}</p>

            <Link to="/register" className="btn-v2 btn-gold btn-spotlight">
              <span>Tham gia thi ngay</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 5: From the Journal ("Góc Tri Thức") */}
      <section className="journal-v2" id="journal">
        <div className="section-header-center">
          <div className="section-tag">GÓC TRI THỨC</div>
          <h2 className="section-title-v2">
            <ScrollTypingText text="Bài Viết & Kinh Nghiệm Học Tập" />
          </h2>
          <p className="section-subtext">
            <ScrollTypingText text="Cập nhật tin tức giáo dục, mẹo làm bài thi và xu hướng công nghệ mới." />
          </p>
        </div>

        <div className="journal-grid">
          {JOURNAL_ARTICLES.map((art) => (
            <article key={art.id} className="journal-card">
              <div className="journal-img-container">
                <img src={art.image} alt={art.title} className="journal-img" />
                <span className="journal-category">{art.category}</span>
              </div>
              <div className="journal-content">
                <div className="journal-meta">
                  <Clock size={14} />
                  <span>{art.readTime}</span>
                </div>
                <h3 className="journal-title">{art.title}</h3>
                <p className="journal-excerpt">{art.excerpt}</p>
                <Link to="/about" className="journal-link">
                  <span>Đọc bài viết</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Section 6: "Let's Talk" & Contact Footer */}
      <section className="talk-v2" id="contact">
        <div className="talk-card">
          <h2 className="talk-title">
            <ScrollTypingText text="Sẵn sàng trải nghiệm DungStudy?" />
          </h2>
          <p className="talk-subtitle">
            <ScrollTypingText text="Cho dù bạn là học sinh muốn nâng cao điểm số hay giáo viên muốn tối ưu hóa quy trình ra đề, hãy bắt đầu ngay hôm nay." />
          </p>

          <div className="talk-contact-item">
            <Mail size={24} className="gold-icon" />
            <a href="mailto:contact@dungstudy.edu.vn" className="talk-email">contact@dungstudy.edu.vn</a>
          </div>
          <div className="talk-contact-item" style={{ marginTop: '0.5rem' }}>
            <Phone size={20} className="gold-icon" />
            <span style={{ color: 'var(--v2-text-muted)' }}>+84 (0) 987 654 321</span>
          </div>

          <div className="talk-actions">
            <Link to="/register" className="btn-v2 btn-gold btn-hero">
              <span>Đăng ký miễn phí</span>
            </Link>
            <Link to="/login" className="btn-v2 btn-outline-gold btn-hero">
              <span>Đăng nhập hệ thống</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Footer (Matching Video Footer) */}
      <footer className="footer-v2">
        <div className="footer-container">
          <div className="footer-col-brand">
            <div className="footer-brand">
              <LogoWaveBounce size="sm" />
              <span className="brand-title">
                Dung<span className="gold-accent">Study</span>
              </span>
            </div>
            <p className="footer-tagline">
              Nền tảng kiểm tra & học tập trực tuyến thông minh cho mọi cấp học K1-K12. Kết hợp tinh thần tri thức & trí tuệ nhân tạo.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">ĐIỀU HƯỚNG</h4>
            <ul className="footer-links">
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/about">Về chúng tôi</Link></li>
              <li><Link to="/architecture">Cấu trúc hệ thống</Link></li>
              <li><a href="#featured-courses">Kho đề thi</a></li>
              <li><a href="#journal">Góc tri thức</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">TÀI KHOẢN</h4>
            <ul className="footer-links">
              <li><Link to="/login">Đăng nhập Học sinh</Link></li>
              <li><Link to="/login">Đăng nhập Giáo viên</Link></li>
              <li><Link to="/register">Tạo tài khoản mới</Link></li>
              <li><Link to="/profile">Hồ sơ cá nhân</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">BẢO MẬT & LIÊN HỆ</h4>
            <ul className="footer-links">
              <li><span style={{ color: 'var(--v2-text-muted)' }}>Anti-cheat Real-time</span></li>
              <li><span style={{ color: 'var(--v2-text-muted)' }}>Mã hóa SSL 256-bit</span></li>
              <li><span style={{ color: 'var(--v2-text-muted)' }}>Gemini AI Core Engine</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 DungStudy — Phát triển bởi Nguyễn Văn Dũng. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </main>
  );
}
