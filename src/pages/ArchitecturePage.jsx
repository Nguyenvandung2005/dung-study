import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Lock, File, Layout, BookOpen, ChevronRight, Eye, EyeOff } from 'lucide-react';
import LogoWaveBounce from '../components/ui/LogoWaveBounce';
import html2pdf from 'html2pdf.js';
import mermaid from 'mermaid';
import './ArchitecturePage.css';

const STARTUP_SECTIONS = [
  { id: 'st-chuong-1', title: 'Chương 1. Tổng quan & Bối cảnh' },
  { id: 'st-chuong-2', title: 'Chương 2. Phân tích Nhu cầu' },
  { id: 'st-chuong-3', title: 'Chương 3. Giải pháp & Lợi thế' },
  { id: 'st-chuong-4', title: 'Chương 4. Mô hình Kinh doanh' },
];

const APPDEV_SECTIONS = [
  { id: 'ad-chuong-1', title: 'Chương 1. Cơ sở lý thuyết' },
  { id: 'ad-chuong-2', title: 'Chương 2. Yêu cầu Hệ thống' },
  { id: 'ad-chuong-3', title: 'Chương 3. Kiến trúc & Use Case' },
  { id: 'ad-chuong-4', title: 'Chương 4. Đặc tả Chức năng' },
  { id: 'ad-chuong-5', title: 'Chương 5. Cơ sở Dữ liệu' },
  { id: 'ad-chuong-6', title: 'Chương 6. UI/UX & Flow' },
  { id: 'ad-chuong-7', title: 'Chương 7. Tổng kết' },
];

export default function ArchitecturePage() {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('appdev');
  const [activeSection, setActiveSection] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isUnlocked) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter, sans-serif',
        sequence: { actorMargin: 50, messageMargin: 40 },
        themeVariables: {
          primaryColor: 'rgba(255,255,255,0.05)',
          primaryTextColor: '#e2e8f0',
          primaryBorderColor: '#38bdf8',
          lineColor: '#94a3b8',
          secondaryColor: 'rgba(56, 189, 248, 0.1)',
          tertiaryColor: 'rgba(0,0,0,0.5)'
        }
      });
      setTimeout(() => {
        mermaid.run({ querySelector: '.mermaid' }).catch(console.error);
      }, 500);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(entry.target.id);
              entry.target.classList.add('in-view');
            }
          });
        },
        { rootMargin: '-10% 0px -20% 0px', threshold: 0.1 }
      );

      const sections = document.querySelectorAll('.report-section');
      sections.forEach((sec) => observer.observe(sec));

      return () => observer.disconnect();
    }
  }, [isUnlocked, activeTab]);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (password === 'Dung20052005@') {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Mật khẩu không đúng. Vui lòng thử lại!');
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const exportPDF = () => {
    const element = contentRef.current;
    const opt = {
      margin: 10,
      filename: `DungStudy_BaoCao.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#080818' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const exportWord = () => {
    const element = contentRef.current;
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Dung Study Document</title>
        <style>
          body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #000; font-size: 13pt; }
          h1, h2, h3, h4 { color: #000; }
          img, svg { max-width: 100%; height: auto; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          table, th, td { border: 1px solid black; padding: 8px; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DungStudy_BaoCao.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isUnlocked) {
    return (
      <div style={{ minHeight: '100vh', background: '#080818', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleUnlock} style={{
          background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
          padding: '3rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center', maxWidth: '400px', width: '90%'
        }}>
          <Lock size={48} color="#4facfe" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ color: '#fff', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Bảo mật Báo Cáo</h2>
          <p style={{ color: '#a0a0c8', marginBottom: '2rem' }}>Vui lòng nhập mật khẩu để xem Hệ thống báo cáo chuyên sâu.</p>
          <div style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              style={{ width: '100%', padding: '1rem', paddingRight: '3rem', borderRadius: '8px', border: '1px solid #a0a0c8', background: 'transparent', color: '#fff', outline: 'none' }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a0a0c8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
            Mở khóa Báo cáo
          </button>
        </form>
      </div>
    );
  }

  const TOC_ITEMS = activeTab === 'startup' ? STARTUP_SECTIONS : APPDEV_SECTIONS;

  return (
    <div className="modern-architecture-page" style={{ minHeight: '100vh', background: '#080818', color: '#e2e8f0', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header */}
      <header className="arch-header glass-header">
        <div className="arch-header-left">
          <Link to="/" className="back-btn" title="Trở về Trang chủ">
            <ArrowLeft size={20} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LogoWaveBounce size="sm" />
            <h1 className="arch-title">Đồ án Phân tích thiết kế: Dung-Study</h1>
          </div>
        </div>
        <div className="arch-header-right">
          <div className="arch-tabs">
            <button className={`arch-tab-btn ${activeTab === 'startup' ? 'active' : ''}`} onClick={() => setActiveTab('startup')}>
              <BookOpen size={16} /> Báo cáo Khởi nghiệp
            </button>
            <button className={`arch-tab-btn ${activeTab === 'appdev' ? 'active' : ''}`} onClick={() => setActiveTab('appdev')}>
              <Layout size={16} /> Đồ án Kiến trúc
            </button>
          </div>
          <button onClick={exportWord} className="export-btn word-btn"><FileText size={16} /> Xuất Word</button>
          <button onClick={exportPDF} className="export-btn pdf-btn"><Download size={16} /> Xuất PDF</button>
        </div>
      </header>

      <div className="arch-layout">
        {/* SIDEBAR T.O.C */}
        <aside className="arch-sidebar">
          <div className="toc-container glass-card">
            <h3 className="toc-title">MỤC LỤC</h3>
            <ul className="toc-list">
              {TOC_ITEMS.map((item) => (
                <li key={item.id}>
                  <button 
                    className={`toc-link ${activeSection === item.id ? 'active' : ''}`}
                    onClick={() => scrollToSection(item.id)}
                  >
                    <ChevronRight size={14} className="toc-icon" />
                    <span>{item.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* NỘI DUNG CHÍNH */}
        <main className="arch-main-content">
          <div ref={contentRef} className="print-container">
            {activeTab === 'startup' && (
              <div className="report-content">
                <div className="title-banner glass-card">
                  <h1>BÁO CÁO KHỞI NGHIỆP: NỀN TẢNG DUNG-STUDY</h1>
                  <p>Giải pháp EdTech Tự động hóa dựa trên Generative AI</p>
                </div>
                
                <section id="st-chuong-1" className="report-section glass-card">
                  <h2>CHƯƠNG 1. TỔNG QUAN & BỐI CẢNH</h2>
                  <p>Trong kỷ nguyên Công nghiệp 4.0 và sự chuyển đổi số diễn ra mạnh mẽ trong mọi lĩnh vực đời sống, Giáo dục không nằm ngoài xu thế đó. Tại Việt Nam, đặc biệt là khu vực miền Trung như tỉnh Nghệ An, công tác kiểm tra, thi cử và đánh giá năng lực học sinh tại các trường trung học vẫn còn nhiều hạn chế, chủ yếu dựa trên các hình thức truyền thống. Điều này không chỉ gây lãng phí tài nguyên, thời gian của giáo viên mà còn làm hạn chế khả năng tự đánh giá, tự học của học sinh.</p>
                  <p>Dự án <strong>Dung-Study</strong> ra đời như một giải pháp toàn diện, ứng dụng trí tuệ nhân tạo (Generative AI) vào việc ra đề thi tự động, tổ chức thi trực tuyến với hệ thống chống gian lận (Anti-cheat) nghiêm ngặt, và đặc biệt là hệ thống tự động chấm điểm bài làm tự luận. Đây là ý tưởng khởi nghiệp nhằm giải quyết triệt để các "điểm đau" (Pain points) của thị trường EdTech hiện nay.</p>
                </section>

                <section id="st-chuong-2" className="report-section glass-card">
                  <h2>CHƯƠNG 2. PHÂN TÍCH NHU CẦU & PAIN POINTS</h2>
                  <h3>2.1. Phân tích điểm đau của khách hàng</h3>
                  <ul>
                    <li><strong>Đối với Giáo viên:</strong> Việc soạn một đề thi chất lượng đòi hỏi phải cân đối ma trận 4 mức độ (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao). Việc này tốn từ 2 đến 3 tiếng cho mỗi đề thi. Hơn nữa, việc chấm điểm hàng trăm bài tự luận của học sinh là một khối lượng công việc khổng lồ, dễ gây sai sót.</li>
                    <li><strong>Đối với Học sinh:</strong> Trải nghiệm làm bài thi trên nền tảng web hiện tại kém tối ưu cho thiết bị di động (Mobile). Các em gặp khó khăn khi đọc đề có công thức toán học bị vỡ, và thao tác nộp bài chụp ảnh rườm rà.</li>
                    <li><strong>Đối với Nhà trường:</strong> Khó khăn trong việc kiểm soát tính minh bạch của các kỳ thi trực tuyến.</li>
                  </ul>
                  <h3>2.2. Khách hàng mục tiêu</h3>
                  <p>Thị trường hướng tới là B2B và B2C:</p>
                  <ul>
                    <li><strong>Giai đoạn 1 (B2C):</strong> Nhắm tới các giáo viên dạy thêm, các trung tâm luyện thi quy mô nhỏ.</li>
                    <li><strong>Giai đoạn 2 (B2B):</strong> Nhắm tới các trường THPT, THCS trên địa bàn tỉnh Nghệ An.</li>
                  </ul>
                </section>

                <section id="st-chuong-3" className="report-section glass-card">
                  <h2>CHƯƠNG 3. GIẢI PHÁP CÔNG NGHỆ VÀ LỢI THẾ CẠNH TRANH</h2>
                  <p>Dung-Study khác biệt hoàn toàn với các nền tảng thi trực tuyến truyền thống nhờ 3 tính năng lõi:</p>
                  <div className="feature-grid">
                    <div className="feature-box">
                      <h4>🤖 Trợ lý AI Sinh đề thi</h4>
                      <p>Tích hợp Gemini API, hệ thống tự sinh ra bộ câu hỏi trắc nghiệm/tự luận chuẩn ma trận 4 mức độ tư duy. Thuật toán SCIENTIFIC_NOTATION_RULE đảm bảo công thức Toán/Hóa/Lý chuẩn mực.</p>
                    </div>
                    <div className="feature-box">
                      <h4>📸 Công nghệ OCR</h4>
                      <p>Giáo viên chụp ảnh đề giấy, hệ thống tự động bóc tách văn bản, hình vẽ và chuyển hóa thành cấu trúc số hóa có thể chỉnh sửa.</p>
                    </div>
                    <div className="feature-box">
                      <h4>🛡️ Anti-Cheat Đa tầng</h4>
                      <p>Nhận diện chuyển tab, tính năng Camera Live-in-App (chụp bài tự luận ngay trên web) và "Ân hạn 90 giây" không ghi nhận gian lận khi tải file.</p>
                    </div>
                  </div>
                </section>

                <section id="st-chuong-4" className="report-section glass-card">
                  <h2>CHƯƠNG 4. MÔ HÌNH KINH DOANH VÀ TÀI CHÍNH</h2>
                  <p>Mô hình kinh doanh dựa trên SaaS (Freemium):</p>
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Gói Dịch vụ</th>
                        <th>Chi phí</th>
                        <th>Quyền lợi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Học sinh (Basic)</strong></td>
                        <td>Miễn phí</td>
                        <td>Làm bài thi, xem điểm, xem lời giải chi tiết, tham gia Leaderboard.</td>
                      </tr>
                      <tr>
                        <td><strong>Giáo viên (Pro)</strong></td>
                        <td>99,000đ/tháng</td>
                        <td>Quản lý lớp học, Tạo đề thi bằng AI (giới hạn 50 lần/tháng), Quét OCR, Chấm tự luận bằng AI.</td>
                      </tr>
                      <tr>
                        <td><strong>Nhà trường (Enterprise)</strong></td>
                        <td>Liên hệ</td>
                        <td>White-label (Đổi logo trường), Server riêng, Không giới hạn AI, SLAs 99.9%.</td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              </div>
            )}

            {activeTab === 'appdev' && (
              <div className="report-content">
                <div className="title-banner glass-card">
                  <h1>ĐỒ ÁN PHÂN TÍCH THIẾT KẾ: DUNG-STUDY</h1>
                  <p>Hệ thống Học tập & Đánh giá năng lực chuyên sâu</p>
                </div>

                <section id="ad-chuong-1" className="report-section glass-card">
                  <h2>CHƯƠNG 1. MỞ ĐẦU VÀ CƠ SỞ LÝ THUYẾT</h2>
                  <h3>1.1. Giới thiệu đề tài</h3>
                  <p>Hệ thống đánh giá năng lực học sinh Dung-Study là một sản phẩm phần mềm quy mô lớn, được xây dựng dựa trên kiến trúc phần mềm hiện đại nhằm số hóa 100% quy trình học tập, thi cử. Hệ thống áp dụng trí tuệ nhân tạo để tối ưu hóa nguồn lực con người trong giáo dục.</p>
                  <h3>1.2. Nền tảng Công nghệ (Tech Stack)</h3>
                  <ul className="tech-list">
                    <li><strong>Frontend:</strong> ReactJS 19, Vite, Glassmorphism UI, Context API.</li>
                    <li><strong>Backend:</strong> NodeJS, ExpressJS, Socket.io (Realtime Notification).</li>
                    <li><strong>Database:</strong> MySQL + Prisma ORM (Type-safe & Migrations).</li>
                    <li><strong>AI Services:</strong> Google Gemini Pro SDK (NLP, Image OCR).</li>
                  </ul>
                </section>

                <section id="ad-chuong-2" className="report-section glass-card">
                  <h2>CHƯƠNG 2. PHÂN TÍCH YÊU CẦU HỆ THỐNG</h2>
                  <h3>2.1. Yêu cầu chức năng</h3>
                  <p>Hệ thống yêu cầu phải đáp ứng đầy đủ các luồng nghiệp vụ khép kín từ khâu quản lý người dùng, khởi tạo đề thi, tổ chức làm bài, đến khâu hậu kiểm (chấm điểm, thống kê). Có 3 cấp phân quyền: Học sinh, Giáo viên, Quản trị viên.</p>
                  <h3>2.2. Yêu cầu phi chức năng</h3>
                  <ul>
                    <li><strong>Hiệu năng:</strong> Tốc độ tải (Load time) dưới 2s. API response dưới 200ms.</li>
                    <li><strong>Bảo mật:</strong> Mã hóa mật khẩu bcrypt, phân quyền bằng JWT. Mọi thao tác ghi/xóa đều phải qua Middleware kiểm tra Auth Token.</li>
                  </ul>
                </section>

                <section id="ad-chuong-3" className="report-section glass-card">
                  <h2>CHƯƠNG 3. THIẾT KẾ KIẾN TRÚC & USE CASE</h2>
                  <h3>3.1. Phân tích Tác nhân</h3>
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Tên Tác Nhân</th>
                        <th>Vai trò & Quyền hạn</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Học sinh (Student)</strong></td>
                        <td>Tham gia thi, nộp bài (trắc nghiệm/tự luận ảnh), xem điểm.</td>
                      </tr>
                      <tr>
                        <td><strong>Giáo viên (Teacher)</strong></td>
                        <td>Soạn đề (AI/Thủ công/OCR), quản lý thi, chấm bài, thống kê.</td>
                      </tr>
                      <tr>
                        <td><strong>Quản trị viên (Admin)</strong></td>
                        <td>Giám sát hệ thống thời gian thực, quản lý IP, Security Logs.</td>
                      </tr>
                      <tr>
                        <td><strong>AI Engine</strong></td>
                        <td>Xử lý NLP sinh đề thi, nhận dạng văn bản ảnh.</td>
                      </tr>
                    </tbody>
                  </table>

                  <h3>3.2. Sơ đồ Use Case Tổng quát</h3>
                  <div className="mermaid-container">
                    <div className="mermaid">
                      {`usecaseDiagram
    actor "Học sinh" as ST
    actor "Giáo viên" as TC
    actor "Admin" as AD
    actor "AI Engine" as AI

    package "Hệ thống Dung-Study" {
      usecase "Đăng nhập/Đăng ký" as UC1
      usecase "Làm bài thi & Nộp ảnh" as UC2
      usecase "Tạo đề bằng AI/OCR" as UC3
      usecase "Chấm bài tự luận" as UC4
      usecase "Giám sát Real-time" as UC5
    }

    ST --> UC1
    ST --> UC2
    TC --> UC1
    TC --> UC3
    TC --> UC4
    AD --> UC1
    AD --> UC5
    AI -- UC3
    AI -- UC4`}
                    </div>
                  </div>
                </section>

                <section id="ad-chuong-4" className="report-section glass-card">
                  <h2>CHƯƠNG 4. ĐẶC TẢ CHI TIẾT CÁC CHỨC NĂNG</h2>
                  
                  <h3>4.1. Chức năng Làm bài thi & Anti-Cheat</h3>
                  <p>Học sinh làm bài dưới sự giám sát nghiêm ngặt của hệ thống về việc chuyển Tab trình duyệt.</p>
                  <div className="mermaid-container">
                    <div className="mermaid">
                      {`stateDiagram-v2
    [*] --> VaoPhongThi
    VaoPhongThi --> BatFullscreen
    BatFullscreen --> LamBai : Bắt đầu tính giờ
    
    state LamBai {
        [*] --> DocCauHoi
        DocCauHoi --> ChonDapAn
        ChonDapAn --> AutoSave
        AutoSave --> DocCauHoi
    }

    LamBai --> GianLan : Chuyển Tab / Thoát
    GianLan --> CanhBao : Vi phạm < 3 lần
    CanhBao --> LamBai : Quay lại
    GianLan --> DinhChi : Vi phạm >= 3 lần
    DinhChi --> NopBaiBatBuoc

    LamBai --> NhapNopBai : Chủ động nộp
    NhapNopBai --> LuuCSDL
    NopBaiBatBuoc --> LuuCSDL
    LuuCSDL --> [*]`}
                    </div>
                  </div>

                  <h3>4.2. Chức năng Tạo đề bằng Trí tuệ Nhân tạo</h3>
                  <div className="mermaid-container">
                    <div className="mermaid">
                      {`sequenceDiagram
    autonumber
    actor TC as Giáo viên
    participant API as Backend (NodeJS)
    participant AI as Gemini SDK
    participant DB as MySQL (Prisma)

    TC->>API: Gửi Prompt (Vd: "Tạo 50 câu Toán")
    activate API
    API->>API: Chèn SCIENTIFIC_NOTATION_RULE
    API->>AI: Gửi Context + Data
    activate AI
    AI-->>API: Trả về JSON Data
    deactivate AI
    API->>API: Validate & Parse
    API-->>TC: Hiển thị Preview
    TC->>API: Bấm "Lưu đề thi"
    API->>DB: Insert Exam & Questions
    DB-->>API: Trả về Exam ID
    API-->>TC: Thông báo thành công
    deactivate API`}
                    </div>
                  </div>
                </section>

                <section id="ad-chuong-5" className="report-section glass-card">
                  <h2>CHƯƠNG 5. THIẾT KẾ CƠ SỞ DỮ LIỆU</h2>
                  <p>Hệ thống quản lý dữ liệu toàn diện với 6 thực thể lõi, chuẩn hóa theo Normalization Form 3.</p>
                  <div className="mermaid-container">
                    <div className="mermaid">
                      {`erDiagram
    User ||--o{ Exam : "CreatedExams (1:N)"
    User ||--o{ Submission : "Submissions (1:N)"
    User ||--o{ SecurityLog : "Logs (1:N)"

    Exam ||--o{ Question : "Questions (1:N)"
    Exam ||--o{ Submission : "Submissions (1:N)"
    Submission ||--o{ SubmissionAnswer : "Answers (1:N)"

    User {
        String id PK
        String email
        String role
    }
    Exam {
        String id PK
        String title
        Int timeLimit
    }
    Question {
        String id PK
        String content
        String type
        Json options
    }
    Submission {
        String id PK
        Float totalScore
        String status
    }`}
                    </div>
                  </div>
                </section>

                <section id="ad-chuong-6" className="report-section glass-card">
                  <h2>CHƯƠNG 6. UI/UX VÀ LUỒNG ĐIỀU HƯỚNG</h2>
                  <p>Giao diện được thiết kế hiện đại, lấy Mobile-First làm triết lý chủ đạo. Các màn hình chính được chia luồng điều hướng chặt chẽ.</p>
                  <div className="mermaid-container">
                    <div className="mermaid">
                      {`graph TD
    A[Landing Page] --> B{Login / Register}
    B -->|Thành công| C{Kiểm tra Role}
    
    C -->|Student| D[Student Dashboard]
    D --> D1[Chọn Đề Thi] --> D2[Làm Bài] --> D3[Xem Điểm]
    
    C -->|Teacher| E[Teacher Dashboard]
    E --> E1[Soạn Đề AI]
    E --> E2[Quản lý Kỳ thi]
    E --> E3[Chấm Tự luận]
    
    C -->|Admin| F[Admin Dashboard]
    F --> F1[Real-time Events]
    F --> F2[Quản lý Logs/IP]`}
                    </div>
                  </div>
                </section>

                <section id="ad-chuong-7" className="report-section glass-card">
                  <h2>CHƯƠNG 7. TỔNG KẾT VÀ HƯỚNG MỞ RỘNG</h2>
                  <h3>7.1. Kết quả đạt được</h3>
                  <p>Hệ thống đã hoàn thiện vòng đời khép kín của một kỳ thi. Tích hợp sâu AI giúp tự động hóa 80% công việc soạn đề và giám sát của giáo viên. Giao diện trực quan, dễ dùng trên cả thiết bị di động và máy tính.</p>
                  <h3>7.2. Định hướng phát triển</h3>
                  <ul>
                    <li><strong>Microservices:</strong> Tách Module Thi trực tuyến (Exam Execution Service) ra khỏi Core Monolith để đảm bảo khả năng chịu tải lên tới 100,000 học sinh.</li>
                    <li><strong>Caching:</strong> Ứng dụng Redis Cache cho các API Public.</li>
                    <li><strong>Native Mobile App:</strong> Xây dựng ứng dụng Flutter để tận dụng quyền kiểm soát thiết bị chống gian lận sâu hơn.</li>
                  </ul>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
