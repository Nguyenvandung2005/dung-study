import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, Activity, ShieldCheck, Users } from 'lucide-react';
import LogoWaveBounce from '../components/ui/LogoWaveBounce';
import './AboutPage.css';

const TerminalTyping = () => {
  const codeLines = [
    "npm run start-ai-server",
    "Loading neural network...",
    "Allocating tensors... OK",
    "Model loaded: DungStudy-GPT",
    "Analyzing user data: 100%",
    "[SUCCESS] System Online."
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
      }, Math.random() * 40 + 20);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setText(prev => prev + '\\n> ');
        setLineIndex(lineIndex + 1);
        setCharIndex(0);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [lineIndex, charIndex]);

  return (
    <div className="typing-text">
      &gt; {text}
      <span className="typing-cursor"></span>
    </div>
  );
};

export default function AboutPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-page" ref={pageRef}>
      <nav className="about-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/">
          <ArrowLeft size={20} /> Trở về trang chủ
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
          <LogoWaveBounce size="sm" />
          <span>Dung-<span style={{ color: 'var(--clr-primary-400)' }}>Study</span></span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="story-hero">
        <div className="story-hero-content reveal">
          <h1 className="story-hero-title">Kỷ Nguyên Mới Của Giáo Dục</h1>
          <p className="story-hero-subtitle">
            Dung-Study không chỉ là một nền tảng thi trắc nghiệm. Chúng tôi đang tái định nghĩa 
            cách giáo viên và học sinh tương tác, kiểm tra và phát triển thông qua sức mạnh của Generative AI.
          </p>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="story-section">
        <div className="story-text reveal">
          <h2>Ý Tưởng Thiết Kế & Triết Lý</h2>
          <p>
            Mọi thứ bắt đầu từ một nỗi trăn trở: Tại sao giáo viên phải tốn hàng giờ đồng hồ để soạn từng câu hỏi trắc nghiệm, 
            và tại sao học sinh lại thiếu đi những phân tích chuyên sâu về năng lực của bản thân sau mỗi kỳ thi?
          </p>
          <p>
            Chúng tôi đã phác thảo ra một kiến trúc hệ thống nơi Trí Tuệ Nhân Tạo (Gemini AI) trở thành người trợ lý vô hình nhưng đắc lực. 
            Từ những bản vẽ Wireframe đầu tiên trong bóng tối, Dung-Study được định hình với triết lý: <strong>Tối giản hóa quy trình - Tối đa hóa hiệu năng.</strong>
          </p>
          <div className="metrics-card">
            <BrainCircuit size={32} color="var(--clr-primary-400)" />
            <div>
              <div className="metrics-label">Cốt lõi công nghệ</div>
              <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>Tích hợp Generative AI & OCR</div>
            </div>
          </div>
        </div>
        <div className="story-image-container reveal" style={{ transitionDelay: '0.2s', background: 'transparent', boxShadow: 'none', animation: 'none' }}>
          <div className="holo-container">
            <div className="holo-scanline"></div>
            <div className="holo-scanline-h"></div>
            <div className="holo-node node-1"></div>
            <div className="holo-node node-2"></div>
            <div className="holo-node node-3"></div>
            <div className="holo-node node-4"></div>
            <div className="holo-node node-5"></div>
            <div className="holo-floating-data data-1">01100101</div>
            <div className="holo-floating-data data-2">SYS_OK</div>
            <div className="holo-grid">
              <div className="holo-box">
                <div className="holo-line delay-1"></div>
                <div className="holo-line delay-2"></div>
                <div className="holo-line delay-3"></div>
              </div>
              <div className="holo-box">
                <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
                   <div style={{ flex: 1, border: '1px solid var(--clr-primary-400)', opacity: 0.5, borderRadius: '4px' }}></div>
                   <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="holo-line delay-1" style={{ width: '100%' }}></div>
                      <div className="holo-line delay-2" style={{ width: '80%' }}></div>
                      <div className="holo-line delay-3" style={{ width: '60%' }}></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="story-section reverse">
        <div className="story-text reveal">
          <h2>Kết Quả Đạt Được & Tác Động</h2>
          <p>
            Vượt qua giới hạn của một dự án thông thường, Dung-Study mang lại khả năng xử lý hàng chục ngàn câu hỏi với ma trận đề thi phức tạp. 
            Hệ thống chấm điểm tự luận bằng AI với độ chính xác cao đã giúp giải phóng 80% thời lượng làm việc của giáo viên.
          </p>
          <p>
            Hệ thống giám sát Anti-cheat đa tầng đảm bảo tính minh bạch tuyệt đối, biến môi trường trực tuyến trở nên nghiêm túc và đáng tin cậy như một kỳ thi thực tế.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
            <div className="metrics-card">
              <Activity size={28} color="var(--clr-emerald-500)" />
              <div>
                <div className="metrics-value">80%</div>
                <div className="metrics-label">Tiết kiệm thời gian</div>
              </div>
            </div>
            <div className="metrics-card">
              <ShieldCheck size={28} color="var(--clr-primary-400)" />
              <div>
                <div className="metrics-value">100%</div>
                <div className="metrics-label">Bảo mật & Anti-cheat</div>
              </div>
            </div>
          </div>
        </div>
        <div className="story-image-container reveal" style={{ transitionDelay: '0.2s', background: 'transparent', boxShadow: 'none', animation: 'none' }}>
          <div className="dash-container">
            <div className="dash-header">
               <div className="dash-skeleton-text" style={{ width: '150px' }}></div>
               <div className="dash-skeleton-text" style={{ width: '80px' }}></div>
            </div>
            <div className="dash-charts">
               <div className="dash-bar-chart">
                  <svg className="dash-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path className="dash-line-path" d="M 0 80 Q 25 20, 50 60 T 100 10" />
                  </svg>
                  <div className="dash-bar"></div>
                  <div className="dash-bar"></div>
                  <div className="dash-bar"></div>
                  <div className="dash-bar"></div>
                  <div className="dash-bar"></div>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                 <div className="dash-donut">
                    <div className="donut-circle">
                       <div className="donut-circle-2"></div>
                       <div className="donut-circle-3"></div>
                       <div className="donut-inner"></div>
                    </div>
                 </div>
                 <div className="dash-stream">
                    <div className="dash-stream-content">
                       <div className="dash-stream-item">Data fetch: OK</div>
                       <div className="dash-stream-item">Latency: 12ms</div>
                       <div className="dash-stream-item">Users: 1,024</div>
                       <div className="dash-stream-item">CPU: 42%</div>
                       <div className="dash-stream-item">Memory: 64%</div>
                       <div className="dash-stream-item">Model: Active</div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="creator-section">
        <div className="creator-profile reveal">
          <div className="creator-avatar-container">
            <img src="/images/creator.png" alt="Developer Coding" className="creator-avatar" />
            <div className="typing-overlay">
              <TerminalTyping />
            </div>
          </div>
          <div className="creator-info">
            <h3>Nguyễn Văn Dũng</h3>
            <span>Nhà sáng lập & Kỹ sư Phần mềm (Full-Stack Developer)</span>
            <p className="creator-quote">
              "Lập trình không chỉ là gõ những dòng mã khô khan. Đó là nghệ thuật giải quyết vấn đề, 
              là mang công nghệ phức tạp nhất để phục vụ những nhu cầu bình dị nhất của con người. 
              Dung-Study là minh chứng cho việc AI có thể làm giáo dục trở nên nhân văn hơn."
            </p>
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
             <div style={{ textAlign: 'center' }}>
               <Users size={24} color="var(--clr-primary-400)" style={{ marginBottom: '0.5rem' }} />
               <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Đối tượng</div>
               <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>B2B & B2C</div>
             </div>
             <div style={{ textAlign: 'center' }}>
               <BrainCircuit size={24} color="var(--clr-rose-500)" style={{ marginBottom: '0.5rem' }} />
               <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chuyên môn</div>
               <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>AI & Web Systems</div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
