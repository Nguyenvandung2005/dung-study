import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import api from '../../api/client';
import './TeacherCreateExam.css';
import ExamForm from '../../components/exam/ExamForm';

// ─── AI Generator Modal ───────────────────────────────────────────────────────
function AIGeneratorModal({ onClose, onGenerated }) {
  const [form, setForm] = useState({ topic: '', subject: '', grade: '10', mcqCount: 10, essayCount: 0, difficulty: '', overallDifficulty: 'Trung bình' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleGenerate = async () => {
    if (!form.topic.trim() || !form.subject.trim()) {
      setError('Vui lòng điền Môn học và Chủ đề.'); return;
    }
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/ai/generate-exam', {
        ...form,
        mcqCount: Number(form.mcqCount),
        essayCount: Number(form.essayCount),
      });
      onGenerated(data.questions || [], form.subject, form.grade, form.topic);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi gọi AI. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      backdropFilter: 'blur(8px)'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 500, borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}>✕</button>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🪄</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Soạn đề nhanh bằng AI
          </h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '4px 12px', borderRadius: 999, marginTop: 10, fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600 }}>
            <span>📍</span> Tuân thủ cấu trúc thi K1–K12 Sở GD&ĐT Nghệ An
          </div>
        </div>


        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Môn học *</label>
            <input name="subject" value={form.subject} onChange={handleChange}
              placeholder="Vd: Toán, Văn, Lý, Hóa, Sinh..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Khối lớp *</label>
            <select name="grade" value={form.grade} onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
            >
              {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1} style={{ background: '#1e1e2d', color: '#fff' }}>Lớp {i + 1}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Chủ đề / Nội dung ôn tập *</label>
            <textarea name="topic" value={form.topic} onChange={handleChange} rows={3}
              placeholder="Vd: Chương 3 – Phương trình bậc hai một ẩn; Chiến dịch Điện Biên Phủ..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Số câu Trắc nghiệm</label>
              <input type="number" name="mcqCount" value={form.mcqCount} onChange={handleChange} min={0} max={100}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Số câu Tự luận</label>
              <input type="number" name="essayCount" value={form.essayCount} onChange={handleChange} min={0} max={20}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Mức độ chung của đề</label>
              <select name="overallDifficulty" value={form.overallDifficulty} onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
              >
                {['Dễ', 'Trung bình', 'Khó', 'Cực khó'].map((lvl) => (
                  <option key={lvl} value={lvl} style={{ background: '#1e1e2d', color: '#fff' }}>{lvl}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Phân bổ chi tiết (tùy chọn)</label>
              <input name="difficulty" value={form.difficulty} onChange={handleChange}
                placeholder="Vd: 3 nhận biết, 2 vận dụng..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>⚠️ {error}</div>}

        <button
          onClick={handleGenerate} disabled={loading}
          style={{
            width: '100%', marginTop: 'var(--space-4)', padding: '12px',
            borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
            background: 'var(--gradient-primary)', color: '#fff', fontSize: '1rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? (
            <><div className="spinner" style={{ width: 18, height: 18 }} /> Đang soạn đề... (~15 giây)</>
          ) : '🪄 Soạn đề ngay'}
        </button>
      </div>
    </div>
  );
}

// ─── Mode Selector ───────────────────────────────────────────────────────────
function ModeSelector({ onSelect, onAI }) {
  return (
    <div className="mode-selector fade-in">
      <h1 className="page-title">➕ Tạo bài kiểm tra <span className="gradient-text">Mới</span></h1>
      <p className="page-subtitle" style={{ marginBottom: 'var(--space-8)' }}>
        Hỗ trợ đẩy câu hỏi tự động qua file Word, PDF hoặc nhập tay thủ công.
      </p>

      {/* AI Quick Create Banner */}
      <div
        onClick={onAI}
        className="glass-card"
        id="mode-ai"
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-6)',
          padding: 'var(--space-5) var(--space-6)', cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.1))',
          border: '1px solid rgba(168,85,247,0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(168,85,247,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      >
        <span style={{ fontSize: '2.5rem', flexShrink: 0 }}>🪄</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#c084fc', marginBottom: 2 }}>Soạn đề nhanh bằng AI (Gemini)</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Chỉ cần nhập chủ đề — AI sẽ tự động tạo toàn bộ câu hỏi trắc nghiệm và tự luận cho bạn.</p>
        </div>
        <span className="btn btn-primary btn-sm" style={{ flexShrink: 0, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>Thử ngay →</span>
      </div>

      <div className="mode-grid">
        <button className="mode-card glass-card" onClick={() => onSelect('manual')} id="mode-manual">
          <span className="mode-icon">📝</span>
          <h3>Tạo thủ công</h3>
          <p>Nhập tay câu hỏi và đáp án trực tiếp với giao diện trực quan.</p>
          <span className="btn btn-primary btn-sm" style={{ marginTop: 'auto' }}>Bắt đầu nhập</span>
        </button>
        <button className="mode-card glass-card" onClick={() => onSelect('word')} id="mode-word">
          <span className="mode-icon">📄</span>
          <h3>Tải file Word (.docx)</h3>
          <p>Hệ thống tự động đọc và bóc tách câu hỏi trắc nghiệm/tự luận.</p>
          <span className="btn btn-outline btn-sm" style={{ marginTop: 'auto' }}>Chọn file Word</span>
        </button>
        <button className="mode-card glass-card" onClick={() => onSelect('pdf')} id="mode-pdf">
          <span className="mode-icon">📕</span>
          <h3>Tải file PDF</h3>
          <p>Quét nội dung PDF để trích xuất danh sách câu hỏi tự động.</p>
          <span className="btn btn-outline btn-sm" style={{ marginTop: 'auto' }}>Chọn file PDF</span>
        </button>
        <button
          className="mode-card glass-card"
          onClick={() => onSelect('ocr')}
          id="mode-ocr"
          style={{ position: 'relative', borderColor: 'rgba(59, 130, 246, 0.4)' }}
        >
          <div style={{ position: 'absolute', top: 12, right: 12, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '4px 10px', borderRadius: 999, letterSpacing: '0.5px' }}>
            AI VISION
          </div>
          <span className="mode-icon">📸</span>
          <h3>Quét Ảnh (OCR)</h3>
          <p>Dùng AI Vision để nhận diện và trích xuất câu hỏi từ hình ảnh chụp đề thi cũ.</p>
          <span className="btn btn-primary btn-sm" style={{ marginTop: 'auto', background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>Chụp / Tải ảnh</span>
        </button>
      </div>
    </div>
  );
}

// ─── File Upload Component ──────────────────────────────────────────
function FileUploadStep({ fileType, onParsed, onBack }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const accept = fileType === 'word' ? '.docx' : '.pdf';

  const normalizeQuestions = (rawQuestions, embeddedImages = []) =>
    (rawQuestions || []).map(q => {
      let imgBase64 = '';
      if (q.hasFigure && q.figureImageIndex >= 0 && embeddedImages[q.figureImageIndex]) {
        const img = embeddedImages[q.figureImageIndex];
        imgBase64 = `data:${img.mimeType || 'image/png'};base64,${img.data}`;
      }
      return {
        id: crypto.randomUUID(),
        type: q.type === 'SINGLE_CHOICE' ? 'MULTIPLE_CHOICE' : (q.type || 'MULTIPLE_CHOICE'),
        content: q.content || '',
        contentIsHtml: q.contentIsHtml || false,
        options: (q.type === 'ESSAY')
          ? ['', '', '', '']
          : Array.isArray(q.options)
            ? q.options.map(o => (typeof o === 'string' ? o : o.text || ''))
            : ['', '', '', ''],
        correctAnswer: (q.type !== 'ESSAY' && (Array.isArray(q.correctAnswer) ? q.correctAnswer.length > 0 : q.correctAnswer != null && q.correctAnswer !== ''))
          ? (Array.isArray(q.correctAnswer)
              ? String('ABCDE'.indexOf(q.correctAnswer[0].toUpperCase()))
              : String(q.correctAnswer))
          : '',
        points: q.points || (q.type === 'ESSAY' ? 2 : 1),
        explanation: q.explanation || '',
        svgFigure: '',
        imageUrl: imgBase64 || '',
      };
    });

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const endpoint = fileType === 'word' ? '/upload/word' : '/upload/pdf';
    try {
      const { data } = await api.post(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Chế độ AI: gọm lại bằng Gemini
      if (useAI) {
        try {
          const aiRes = await api.post('/ai/parse-document', {
            text: data.rawText || '',
            htmlContent: data.rawHtml || '',
            imagesBase64: data.embeddedImages || [],
            fileType,
          });
          onParsed(normalizeQuestions(aiRes.data.questions, data.embeddedImages));
          return;
        } catch (aiErr) {
          // AI thất bại → dùng kết quả regex
          console.warn('[AI Parse] Failed, falling back to regex result:', aiErr.message);
        }
      }

      onParsed(normalizeQuestions(data.questions, data.embeddedImages));
    } catch (e) {
      const msg = e.response?.data?.message || 'Không thể đọc file. Hãy kiểm tra định dạng đúng chuẩn.';
      const raw = e.response?.data?.rawText || e.response?.data?.rawHtml;
      setError(msg + (raw ? `\n\nNội dung đọc được: "${raw.substring(0, 300)}..."` : ''));
    } finally {
      setUploading(false);
    }
  };

  const loadingMsg = uploading
    ? (useAI ? 'AI đang phân tích cấu trúc đề... (~20 giây)' : 'Đang phân tích file... Chờ một chút nhé!')
    : null;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Quay lại</button>
        <h1 className="page-title" style={{ margin: 0 }}>
          {fileType === 'word' ? '📄 Upload file Word' : '📕 Upload file PDF'}
        </h1>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>⚠️ {error}</div>}

      {/* AI Toggle */}
      <div className="glass-card" style={{
        padding: '14px 18px', marginBottom: 'var(--space-4)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        border: useAI ? '1px solid rgba(139,92,246,0.5)' : '1px solid var(--border-subtle)',
        background: useAI ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.5rem' }}>🤖</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: useAI ? '#a78bfa' : 'var(--text-primary)', margin: 0 }}>
              AI Hỗ trợ Đọc File (Gemini)
            </p>
            <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {useAI
                ? '✅ Bật — AI sẽ đọc và phân tích thông minh mọi cấu trúc đề, kể cả đáp án cuối trang (~20s)'
                : 'Tắt — Dùng phân tích thông thường (nhanh hơn, đầu tiên chạy Regex)'}
            </p>
          </div>
        </div>
        {/* Toggle switch */}
        <div
          onClick={() => setUseAI(v => !v)}
          style={{
            width: 48, height: 26, borderRadius: 999, cursor: 'pointer', position: 'relative',
            background: useAI ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.15)',
            transition: 'background 0.3s ease', flexShrink: 0,
            boxShadow: useAI ? '0 0 12px rgba(139,92,246,0.5)' : 'none',
          }}
        >
          <div style={{
            position: 'absolute', top: 3, left: useAI ? 25 : 3, width: 20, height: 20,
            borderRadius: '50%', background: '#fff', transition: 'left 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }} />
        </div>
      </div>

      <div
        className={`upload-zone glass-card ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current.click()}
      >
        <input type="file" ref={fileRef} accept={accept} style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
        {uploading ? (
          <>
            <div className="spinner" style={{ width: 48, height: 48 }} />
            <p style={{ marginTop: 16 }}>{loadingMsg}</p>
            {useAI && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gemini đang đọc toàn bộ nội dung và tìm hiểu cấu trúc đề...</p>}
          </>
        ) : (
          <>
            <span style={{ fontSize: '4rem' }}>{fileType === 'word' ? '📄' : '📕'}</span>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Kéo thả file {fileType === 'word' ? '.docx' : '.pdf'} vào đây
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>hoặc click để chọn file</p>
            <span className="btn btn-primary">Chọn file {fileType === 'word' ? 'Word' : 'PDF'}</span>
          </>
        )}
      </div>

      <div className="glass-card" style={{ padding: 'var(--space-5)', marginTop: 'var(--space-5)' }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>📌 Định dạng file {fileType === 'word' ? 'Word' : 'PDF'} được hỗ trợ:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--clr-primary-400)', marginBottom: 4 }}>Câu trắc nghiệm:</p>
            <pre style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
              {`Câu 1. Nội dung câu hỏi?\nA. Đáp án A\nB. Đáp án B\nC. Đáp án C\nD. Đáp án D\nĐáp án: A`}
            </pre>
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--clr-emerald-500)', marginBottom: 4 }}>Câu tự luận (bắt buộc ghi [Tự luận]):</p>
            <pre style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
              {`Câu 2. [Tự luận] Nội dung câu hỏi?
Gợi ý: Đáp án tham khảo để AI chấm`}
            </pre>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--clr-amber-500)', marginTop: 8 }}>
          ⚠️ Câu tự luận PHẢI có <strong>[Tự luận]</strong> ở đầu nội dung, nếu không hệ thống sẽ nhận diện nhầm thành trắc nghiệm.
        </p>
      </div>
    </div>
  );
}

// ─── OCR Vision Scan Component ────────────────────────────────────────────────
function OCRScanStep({ onParsed, onBack }) {
  const fileRef = useRef();
  const [images, setImages] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const processFiles = (files) => {
    if (!files || files.length === 0) return;
    setError('');
    const newImgs = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: file.name,
            base64: e.target.result,
            mimeType: file.type || 'image/jpeg',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

// Helper: AI tái hiện hình vẽ chính xác thành SVG cho câu hỏi (thay thế việc cắt ảnh)
async function autoCropQuestionsWithImageBox(questions, images) {
  return Promise.all(
    questions.map(async (q) => {
      if (!q.imageBox || !Array.isArray(q.imageBox) || q.imageBox.length !== 4) {
        return q;
      }
      try {
        const sourceImg = images[q.pageIndex || 0] || images[0];
        if (!sourceImg) return q;
        const srcUrl = sourceImg.base64 || sourceImg.url || sourceImg;

        // Bước 1: Cắt vùng hình vẽ từ ảnh gốc
        const croppedUrl = await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            let [ymin, xmin, ymax, xmax] = q.imageBox;
            if (ymin > 1 || xmin > 1 || ymax > 1 || xmax > 1) {
              ymin /= 1000; xmin /= 1000; ymax /= 1000; xmax /= 1000;
            }
            const x = Math.max(0, xmin * img.naturalWidth);
            const y = Math.max(0, ymin * img.naturalHeight);
            const w = Math.min(img.naturalWidth - x, (xmax - xmin) * img.naturalWidth);
            const h = Math.min(img.naturalHeight - y, (ymax - ymin) * img.naturalHeight);

            if (w < 10 || h < 10) { resolve(''); return; }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve('');
          img.src = srcUrl;
        });

        if (!croppedUrl) return q;

        // Bước 2: Gọi AI vẽ lại SVG chính xác dựa trên ảnh cắt
        try {
          const { data } = await api.post('/ai/figure-to-svg', {
            imageBase64: croppedUrl,
            mimeType: 'image/png',
            questionContent: q.content || '',
          });
          if (data.svgCode) {
            return { ...q, svgFigure: data.svgCode, imageUrl: '' };
          }
        } catch (svgErr) {
          console.warn('[Figure SVG] AI failed for question, using cropped image:', svgErr.message);
          // Fallback: dùng ảnh cắt nếu AI thất bại
          return { ...q, imageUrl: croppedUrl, svgFigure: '' };
        }
      } catch (err) {
        console.warn('Auto crop failed for question:', q.id, err);
      }
      return q;
    })
  );
}

  const handleScanAI = async () => {
    if (images.length === 0) {
      setError('Vui lòng thêm ít nhất 1 hình ảnh đề thi để AI phân tích.');
      return;
    }
    setError('');
    setScanning(true);
    try {
      const payload = images.map((img) => ({
        base64: img.base64,
        mimeType: img.mimeType,
      }));
      const { data } = await api.post('/ai/scan-exam-image', { images: payload });
      const rawQs = data.questions || [];
      const autoCroppedQs = await autoCropQuestionsWithImageBox(rawQs, images);
      onParsed(autoCroppedQs, images);
    } catch (e) {
      setError(e.response?.data?.message || 'Lỗi khi AI nhận diện ảnh đề thi. Vui lòng thử lại ảnh sáng và rõ hơn.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div
      className="fade-in"
      onPaste={(e) => {
        if (e.clipboardData && e.clipboardData.files.length > 0) {
          processFiles(e.clipboardData.files);
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Quay lại</button>
        <h1 className="page-title" style={{ margin: 0 }}>📸 Quét Ảnh Đề Thi (AI Vision OCR)</h1>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>⚠️ {error}</div>}

      <div
        className={`upload-zone glass-card ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current.click()}
        style={{
          border: '2px dashed rgba(59, 130, 246, 0.4)',
          background: 'rgba(30, 41, 59, 0.4)',
          cursor: 'pointer',
          padding: 'var(--space-8)',
          textAlign: 'center',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <input
          type="file"
          ref={fileRef}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => processFiles(e.target.files)}
        />
        <span style={{ fontSize: '3.8rem' }}>📸</span>
        <p style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '10px' }}>
          Kéo thả ảnh đề thi (hoặc Dán <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Ctrl + V</kbd>) vào đây
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
          Hỗ trợ chọn hoặc chụp nhiều trang đề thi cùng lúc (PNG, JPG, WEBP...)
        </p>
        <span className="btn btn-primary btn-sm" style={{ marginTop: '14px' }}>Chọn hình ảnh từ máy</span>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              🖼️ Ảnh đề thi đã chọn ({images.length} trang)
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setImages([])} style={{ color: '#f87171' }}>
              Xóa tất cả
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
            {images.map((img, index) => (
              <div
                key={img.id}
                className="glass-card"
                style={{
                  position: 'relative',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.id); }}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    zIndex: 2,
                  }}
                >
                  ✕
                </button>
                <img
                  src={img.base64}
                  alt={img.name}
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Trang {index + 1}: {img.name}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={handleScanAI}
            disabled={scanning}
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              marginTop: 'var(--space-6)',
              padding: '16px',
              fontSize: '1.1rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.35)',
            }}
          >
            {scanning ? (
              <><div className="spinner" style={{ width: 22, height: 22 }} /> AI Vision đang quét ảnh và nhận diện câu hỏi... (~10 - 15s)</>
            ) : (
              '✨ Phân tích & Trích xuất câu hỏi bằng AI Vision'
            )}
          </button>
        </div>
      )}

      <div className="glass-card" style={{ padding: 'var(--space-5)', marginTop: 'var(--space-6)' }}>
        <p style={{ fontWeight: 600, marginBottom: 8, color: '#60a5fa' }}>💡 Mẹo chụp ảnh đề thi chính xác nhất:</p>
        <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: 1.8, margin: 0 }}>
          <li>Chụp ảnh đủ ánh sáng, rõ nét, không bị lóa hoặc mờ chữ.</li>
          <li>Giữ trang đề thi nằm thẳng (không nghiêng quá 45 độ).</li>
          <li>Bạn có thể chụp nhiều trang đề thi liên tiếp và tải lên cùng một lượt, AI sẽ tự động đọc tuần tự từ trang 1 đến trang cuối.</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeacherCreateExam() {
  const [mode, setMode] = useState(null);
  const [parsedQs, setParsedQs] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [initialAIMeta, setInitialAIMeta] = useState(null);
  const [ocrSourceImages, setOcrSourceImages] = useState([]);
  const navigate = useNavigate();

  const handleParsed = (questions, sourceImgs = []) => {
    setParsedQs(questions);
    setInitialAIMeta(null);
    setOcrSourceImages(sourceImgs);
    setMode('form');
  };

  const handleAIGenerated = (questions, subject, grade, topic) => {
    setShowAIModal(false);
    setParsedQs(questions);

    let normalizedSubject = 'Khác';
    const sLow = (subject || '').toLowerCase();
    if (sLow.includes('toán')) normalizedSubject = 'Toán';
    else if (sLow.includes('văn')) normalizedSubject = 'Văn';
    else if (sLow.includes('anh')) normalizedSubject = 'Anh';
    else if (sLow.includes('lý') || sLow.includes('vật lí')) normalizedSubject = 'Lý';
    else if (sLow.includes('hóa')) normalizedSubject = 'Hóa';
    else if (sLow.includes('sinh')) normalizedSubject = 'Sinh';
    else if (sLow.includes('sử')) normalizedSubject = 'Sử';
    else if (sLow.includes('địa')) normalizedSubject = 'Địa';
    else if (sLow.includes('gdcd') || sLow.includes('công dân')) normalizedSubject = 'GDCD';
    else if (sLow.includes('tin')) normalizedSubject = 'Tin học';

    // Đồng bộ Môn học và Khối lớp cho Form chính
    setInitialAIMeta({
      title: topic || `Bài kiểm tra ${subject || 'AI'} lớp ${grade || 10}`,
      subject: normalizedSubject,
      grade: Number(grade) || 10,
      timeLimit: 45,
      description: 'Đề kiểm tra được tạo tự động bởi AI.',
      startAt: '',
      endAt: ''
    });
    setMode('form');
  };

  const handleSave = async (meta, questions, publish) => {
    const payload = {
      ...meta,
      grade: Number(meta.grade),
      timeLimit: Number(meta.timeLimit),
      isPublished: publish,
      questions: questions.map((q, idx) => ({
        order: idx + 1,
        type: q.type,
        content: q.content,
        options: q.type !== 'ESSAY' ? q.options : [],
        correctAnswer: q.type !== 'ESSAY' ? q.correctAnswer : null,
        points: q.points,
        explanation: q.explanation,
        imageUrl: q.svgFigure ? `data:image/svg+xml,${encodeURIComponent(q.svgFigure)}` : (q.imageUrl || null),
      })),
    };
    const { data } = await api.post('/exams', payload);
    navigate(`/teacher?created=${data.id}`);
  };

  let content;
  if (!mode) {
    content = <ModeSelector
      onSelect={(m) => {
        if (m === 'manual') { setParsedQs([]); setMode('form'); }
        else setMode(m);
      }}
      onAI={() => setShowAIModal(true)}
    />;
  } else if (mode === 'word' || mode === 'pdf') {
    content = <FileUploadStep fileType={mode} onParsed={handleParsed} onBack={() => setMode(null)} />;
  } else if (mode === 'ocr') {
    content = <OCRScanStep onParsed={handleParsed} onBack={() => setMode(null)} />;
  } else {
    content = <ExamForm
      initialMeta={initialAIMeta}
      initialQuestions={parsedQs || []}
      onBack={() => { setMode(null); setParsedQs(null); }}
      onSave={handleSave}
      isEditMode={false}
      ocrSourceImages={ocrSourceImages}
    />;
  }


  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content">
        {content}
        {showAIModal && (
          <AIGeneratorModal
            onClose={() => setShowAIModal(false)}
            onGenerated={handleAIGenerated}
          />
        )}
      </main>
    </div>
  );
}
