import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BrainCircuit,
  Activity,
  ShieldCheck,
  Users,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Sun,
  Moon,
  Zap
} from 'lucide-react';
import LogoWaveBounce from '../components/ui/LogoWaveBounce';
import './AboutPage.css';

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

const TerminalTyping = () => {
  const codeLines = [
    "npm run start-dungstudy-ai",
    "Initializing Gemini AI Engine...",
    "Allocating neural tensors... OK",
    "Model loaded: DungStudy-GPT v2.6",
    "Securing Anti-cheat Sockets... ACTIVE",
    "[SUCCESS] Educational Platform Ready."
  ];
  const [text, setText] = useState('');
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (lineIndex >= codeLines.length) {
      const timeout = setTimeout(() => {
        setText('');
        setLineIndex(0);
        setCharIndex(0);
      }, 4000);
      return () => clearTimeout(timeout);
    }
    const currentLine = codeLines[lineIndex];
    if (charIndex < currentLine.length) {
      const timeout = setTimeout(() => {
        setText(prev => prev + currentLine[charIndex]);
        setCharIndex(charIndex + 1);
      }, Math.random() * 30 + 20);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setText(prev => prev + '\n> ');
        setLineIndex(lineIndex + 1);
        setCharIndex(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [lineIndex, charIndex]);

  return (
    <div className="typing-text-v2">
      &gt; {text}
      <span className="typing-cursor-v2"></span>
    </div>
  );
};

export default function AboutPage() {
  const pageRef = useRef(null);
  const [themeMode, setThemeMode] = useState('night');
  const isInternalChange = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.12 }
    );

    const elements = document.querySelectorAll('.reveal-v2');
    elements.forEach((el) => observer.observe(el));

    const checkTheme = () => {
      if (isInternalChange.current) return;
      const isLight = document.documentElement.classList.contains('light-theme') ||
        document.body.classList.contains('light-theme');
      const isAura = document.documentElement.classList.contains('aura-theme') ||
        document.body.classList.contains('aura-theme');
      if (isLight) {
        setThemeMode('day');
      } else if (isAura) {
        setThemeMode('aura');
      } else {
        setThemeMode('night');
      }
    };
    checkTheme();
    const themeObs = new MutationObserver(checkTheme);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    themeObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
      themeObs.disconnect();
    };
  }, []);

  const handleThemeChange = (newTheme) => {
    isInternalChange.current = true;
    setThemeMode(newTheme);
    document.documentElement.classList.remove('light-theme', 'aura-theme');
    document.body.classList.remove('light-theme', 'aura-theme');
    if (newTheme === 'day') {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme');
    } else if (newTheme === 'aura') {
      document.documentElement.classList.add('aura-theme');
      document.body.classList.add('aura-theme');
    }
    setTimeout(() => {
      isInternalChange.current = false;
    }, 100);
  };

  return (
    <div className={`about-page-v2 theme-${themeMode}`} ref={pageRef}>
      {/* Fixed Fullscreen Background Image & Progressive Blur Overlay */}
      <div className="v2-page-bg">
        <div className="v2-bg-image" />
        <div className="v2-bg-overlay" />
      </div>

      {/* Top Navbar */}
      <nav className="about-nav-v2">
        <Link to="/" className="nav-back-link">
          <ArrowLeft size={18} />
          <span>Trở về trang chủ</span>
        </Link>
        <div className="nav-brand-about">
          <LogoWaveBounce size="sm" />
          <span>Dung<span className="gold-accent">Study</span></span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="about-hero-v2">
        <div className="about-hero-content reveal-v2">
          <div className="hero-pill-badge">
            <Sparkles size={16} className="gold-icon" />
            <span>TẦM NHÌN & SỨ MỆNH GIÁO DỤC</span>
          </div>

          <h1 className="about-hero-title">
            <ScrollTypingText text="Kỷ Nguyên Mới Của " />
            <span className="serif-highlight">
              <ScrollTypingText text="Tri Thức" />
            </span>
            <ScrollTypingText text=" & " />
            <span className="serif-highlight">
              <ScrollTypingText text="Công Nghệ" />
            </span>
            <ScrollTypingText text="." />
          </h1>

          <p className="about-hero-subtitle">
            <ScrollTypingText text="DungStudy kết hợp tôn vinh tri thức, tinh thần đạo đức và sức mạnh tiên phong của Generative AI để tái định nghĩa môi trường kiểm tra & học tập trực tuyến." />
          </p>
        </div>

        <div className="about-hero-showcase reveal-v2">
          <div className="about-image-frame">
            <InteractiveBuilding
              src="/images/hero_study_cathedral.png"
              alt="Catholic Academic Cathedral Sanctuary"
              themeMode={themeMode}
              className="about-showcase-img"
            />
            <div className="about-glass-caption">
              <GraduationCap size={24} className="gold-icon" />
              <div>
                <span className="caption-title">Tôn Vinh Tri Thức & Đạo Đức Học Đường</span>
                <span className="caption-sub">Không gian học tập chuẩn mực và truyền cảm hứng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Vision & Philosophy */}
      <section className="about-section-v2">
        <div className="about-container-v2 grid-2">
          <div className="about-text-col reveal-v2">
            <div className="section-tag">TRIẾT LÝ THIẾT KẾ</div>
            <h2>
              <ScrollTypingText text="Tối Giản Hóa Quy Trình — Tối Đa Hóa Hiệu Năng" />
            </h2>
            <p>
              <ScrollTypingText text="Dự án khởi đầu từ mong muốn giải quyết thách thức lớn của giáo viên: làm sao để soạn đề thi nhanh chóng, bảo mật và cung cấp cho học sinh bức tranh toàn diện về năng lực học tập sau mỗi kỳ kiểm tra." />
            </p>
            <p>
              <ScrollTypingText text="Chúng tôi phác thảo nên kiến trúc DungStudy nơi Generative AI trở thành người trợ lý đắc lực. Từ câu hỏi trắc nghiệm đơn, trắc nghiệm chọn nhiều đáp án đến câu tự luận phức tạp — hệ thống tự động hóa toàn bộ quá trình chấm điểm và phân tích." />
            </p>

            <div className="metrics-grid-v2">
              <div className="metric-box-v2">
                <div className="metric-val">80%</div>
                <div className="metric-lbl">Tiết kiệm thời gian làm đề</div>
              </div>
              <div className="metric-box-v2">
                <div className="metric-val">100%</div>
                <div className="metric-lbl">Bảo mật & Anti-cheat</div>
              </div>
            </div>
          </div>

          <div className="about-visual-col reveal-v2">
            <div className="story-img-card">
              <img src="/images/course_smart_prep.png" alt="Students in Cathedral Library" className="story-img-v2" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: AI Core Blueprint & Tech */}
      <section className="about-section-v2 alt-bg">
        <div className="about-container-v2 grid-2 reverse">
          <div className="about-text-col reveal-v2">
            <div className="section-tag">CỐT LÕI CÔNG NGHỆ AI</div>
            <h2>
              <ScrollTypingText text="Generative AI & Giám Sát Thời Gian Thực" />
            </h2>
            <p>
              <ScrollTypingText text="DungStudy tích hợp mô hình Gemini AI thế nghe mới nhất cho phép tự động nhận diện câu hỏi từ file Word/PDF, phân tích ngữ nghĩa câu hỏi và đưa ra lời giải chi tiết từng bước." />
            </p>
            <ul className="about-bullets-v2">
              <li><CheckCircle2 size={18} className="gold-icon" /> AI chấm điểm câu hỏi tự luận với thang điểm chuẩn xác</li>
              <li><CheckCircle2 size={18} className="gold-icon" /> Socket.io giám sát phiên làm bài real-time chống rò rỉ đề</li>
              <li><CheckCircle2 size={18} className="gold-icon" /> Thuật toán đo lường thời gian dừng lại ở từng câu hỏi</li>
            </ul>
          </div>

          <div className="about-visual-col reveal-v2">
            <div className="blueprint-showcase-v2">
              <InteractiveBuilding
                src="/images/about_wireframe_cathedral.png"
                alt="System Blueprint"
                themeMode={themeMode}
                className="blueprint-img-v2"
              />
              <div className="blueprint-scanline-v2" />
              <div className="blueprint-label-v2">
                <BrainCircuit size={18} className="gold-icon" />
                <span>ARCHITECTURAL WIREFRAME ENGINE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Creator Profile */}
      <section className="creator-section-v2">
        <div className="creator-card-v2 reveal-v2">
          <div className="creator-avatar-wrap">
            <img src="/images/creator.png" alt="Developer Nguyễn Văn Dũng" className="creator-img-v2" />
            <div className="terminal-badge-v2">
              <TerminalTyping />
            </div>
          </div>

          <div className="creator-info-v2">
            <span className="creator-role-tag">NHÀ SÁNG LẬP & KỸ SƯ PHẦN MỀM</span>
            <h2 className="creator-name">Nguyễn Văn Dũng</h2>
            <p className="creator-quote-v2">
              "Lập trình không chỉ là gõ những dòng mã khô khan. Đó là nghệ thuật giải quyết vấn đề, là mang công nghệ phức tạp nhất để phục vụ những nhu cầu tri thức bình dị nhất. DungStudy là minh chứng cho việc AI có thể làm cho giáo dục trở nên minh bạch và nhân văn hơn."
            </p>

            <div className="creator-stats-v2">
              <div className="c-stat">
                <Users size={20} className="gold-icon" />
                <div>
                  <span className="c-stat-lbl">Đối tượng phục vụ</span>
                  <span className="c-stat-val">Học sinh & Giáo viên K1-K12</span>
                </div>
              </div>
              <div className="c-stat">
                <BrainCircuit size={20} className="gold-icon" />
                <div>
                  <span className="c-stat-lbl">Chuyên môn cốt lõi</span>
                  <span className="c-stat-val">AI & Web Systems</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="about-cta-v2">
        <div className="about-cta-box reveal-v2">
          <h2>
            <ScrollTypingText text="Khám phá hệ thống DungStudy ngay" />
          </h2>
          <p>
            <ScrollTypingText text="Tạo tài khoản miễn phí hoặc đăng nhập để trải nghiệm các tính năng thi trắc nghiệm AI." />
          </p>
          <div className="about-cta-btns">
            <Link to="/register" className="btn-v2 btn-gold btn-hero">
              <span>Đăng ký miễn phí</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/" className="btn-v2 btn-outline-gold btn-hero">
              <span>Trở về trang chủ</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Theme Control Widget (Matching Reference Video) */}
      <div className="floating-theme-widget">
        <span className="widget-label">Chế độ xem:</span>
        <button
          className={`theme-btn ${themeMode === 'night' ? 'active' : ''}`}
          onClick={() => handleThemeChange('night')}
          title="Giao diện Ban Đêm (Luxury Dark)"
        >
          <Moon size={15} />
          <span>Night</span>
        </button>
        <button
          className={`theme-btn ${themeMode === 'day' ? 'active' : ''}`}
          onClick={() => handleThemeChange('day')}
          title="Giao diện Ban Ngày (Light Mode)"
        >
          <Sun size={15} />
          <span>Day</span>
        </button>
        <button
          className={`theme-btn ${themeMode === 'aura' ? 'active' : ''}`}
          onClick={() => handleThemeChange('aura')}
          title="Giao diện Aura Cyber"
        >
          <Zap size={15} />
          <span>Aura</span>
        </button>
      </div>

      <footer className="footer-v2" style={{ marginTop: '4rem' }}>
        <div className="footer-bottom">
          <p>© 2026 DungStudy — Phát triển bởi Nguyễn Văn Dũng. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  );
}
