import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import api from '../../api/client';
import './TeacherCreateExam.css';
import ExamForm from '../../components/exam/ExamForm';

// ─── Mode Selector ───────────────────────────────────────────────────────────
function ModeSelector({ onSelect }) {
  return (
    <div className="mode-selector fade-in">
      <h1 className="page-title">➕ Tạo bài kiểm tra <span className="gradient-text">Mới</span></h1>
      <p className="page-subtitle" style={{ marginBottom: 'var(--space-8)' }}>
        Hỗ trợ đẩy câu hỏi tự động qua file Word, PDF hoặc nhập tay thủ công.
      </p>
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
      </div>
    </div>
  );
}

// ─── File Upload Component ────────────────────────────────────────────────────
function FileUploadStep({ fileType, onParsed, onBack }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const accept = fileType === 'word' ? '.docx' : '.pdf';

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
      const normalized = (data.questions || []).map(q => ({
        id: crypto.randomUUID(),
        type: q.type === 'SINGLE_CHOICE' ? 'MULTIPLE_CHOICE' : (q.type || 'MULTIPLE_CHOICE'),
        content: q.content || '',
        contentIsHtml: q.contentIsHtml || false,
        options: (q.type === 'ESSAY')
          ? ['', '', '', '']
          : Array.isArray(q.options)
            ? q.options.map(o => (typeof o === 'string' ? o : o.text || ''))
            : ['', '', '', ''],
        correctAnswer: (q.type !== 'ESSAY' && Array.isArray(q.correctAnswer) && q.correctAnswer.length)
          ? String('ABCDE'.indexOf(q.correctAnswer[0].toUpperCase()))
          : '',
        points: q.points || (q.type === 'ESSAY' ? 2 : 1),
        explanation: q.explanation || '',
      }));
      onParsed(normalized);
    } catch (e) {
      const msg = e.response?.data?.message || 'Không thể đọc file. Hãy kiểm tra định dạng đúng chuẩn.';
      const raw = e.response?.data?.rawText || e.response?.data?.rawHtml;
      setError(msg + (raw ? `\n\nNội dung đọc được: "${raw.substring(0, 300)}..."` : ''));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Quay lại</button>
        <h1 className="page-title" style={{ margin: 0 }}>
          {fileType === 'word' ? '📄 Upload file Word' : '📕 Upload file PDF'}
        </h1>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>⚠️ {error}</div>}

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
            <p>Đang phân tích file... Chờ một chút nhé!</p>
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
{`Câu 1. Nội dung câu hỏi?
A. Đáp án A
B. Đáp án B
C. Đáp án C
D. Đáp án D
Đáp án: A`}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TeacherCreateExam() {
  const [mode, setMode] = useState(null);
  const [parsedQs, setParsedQs] = useState(null);
  const navigate = useNavigate();

  const handleParsed = (questions) => {
    setParsedQs(questions);
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
      })),
    };
    const { data } = await api.post('/exams', payload);
    navigate(`/teacher?created=${data.id}`);
  };

  let content;
  if (!mode) {
    content = <ModeSelector onSelect={(m) => {
      if (m === 'manual') { setParsedQs([]); setMode('form'); }
      else setMode(m);
    }} />;
  } else if (mode === 'word' || mode === 'pdf') {
    content = <FileUploadStep fileType={mode} onParsed={handleParsed} onBack={() => setMode(null)} />;
  } else {
    content = <ExamForm 
                initialMeta={null}
                initialQuestions={parsedQs || []} 
                onBack={() => { setMode(null); setParsedQs(null); }}
                onSave={handleSave}
                isEditMode={false}
              />;
  }

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content">
        {content}
      </main>
    </div>
  );
}
