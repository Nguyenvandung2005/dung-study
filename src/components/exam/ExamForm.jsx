import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/client';

export const SUBJECTS = ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa', 'GDCD', 'Tin học', 'Khác'];
export const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export const emptyQuestion = () => ({
  id: crypto.randomUUID(),
  type: 'MULTIPLE_CHOICE',
  content: '',
  contentIsHtml: false,
  options: ['', '', '', ''],
  correctAnswer: '',
  points: 1,
  explanation: '',
  imageUrl: '',
  svgFigure: '',
});

// ─── AI Figure Modal: Cắt vùng chọn → AI vẽ lại SVG chính xác ───────────────
function AIFigureModal({ ocrImages = [], onApply, onClose }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [startPt, setStartPt] = useState(null);
  const [endPt, setEndPt] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewSvg, setPreviewSvg] = useState(null);
  const [genError, setGenError] = useState('');
  const imgRef = useRef(null);

  const activeImg = ocrImages[selectedIdx] || ocrImages[0];

  const handleMouseDown = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    setStartPt({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setEndPt({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
    setPreviewSvg(null);
    setGenError('');
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !startPt) return;
    const rect = imgRef.current.getBoundingClientRect();
    setEndPt({
      x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, e.clientY - rect.top)),
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getSelectionBox = () => {
    if (!startPt || !endPt) return null;
    const left = Math.min(startPt.x, endPt.x);
    const top = Math.min(startPt.y, endPt.y);
    const width = Math.abs(endPt.x - startPt.x);
    const height = Math.abs(endPt.y - startPt.y);
    if (width < 2 || height < 2) return null;
    return { left, top, width, height };
  };

  const cropToBase64 = () => {
    if (!imgRef.current || !startPt || !endPt) return null;
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;
    const x = Math.min(startPt.x, endPt.x) * scaleX;
    const y = Math.min(startPt.y, endPt.y) * scaleY;
    const w = Math.abs(endPt.x - startPt.x) * scaleX;
    const h = Math.abs(endPt.y - startPt.y) * scaleY;
    if (w < 10 || h < 10) return null;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(imgRef.current, x, y, w, h, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  };

  const handleGenerateSVG = async () => {
    const box = getSelectionBox();
    if (!box) { setGenError('Vui lòng kéo chọn vùng hình vẽ trước!'); return; }
    const croppedBase64 = cropToBase64();
    if (!croppedBase64) { setGenError('Không thể cắt vùng đã chọn.'); return; }
    setGenerating(true);
    setGenError('');
    try {
      const { data } = await api.post('/ai/figure-to-svg', {
        imageBase64: croppedBase64,
        mimeType: 'image/png',
      });
      setPreviewSvg(data.svgCode);
    } catch (e) {
      setGenError(e.response?.data?.message || 'AI không thể vẽ SVG. Vui lòng thử lại hoặc chọn vùng khác.');
    } finally {
      setGenerating(false);
    }
  };

  const box = getSelectionBox();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(10,14,26,0.88)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 960, maxHeight: '95vh', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139,92,246,0.08)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>🎨</span> AI Vẽ Hình Toán Học từ Đề Thi
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Kéo chuột khoanh vùng hình vẽ → AI tái hiện chính xác thành SVG vector sắc nét</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ fontSize: '1.2rem' }}>✕</button>
        </div>

        {/* Page tabs */}
        {ocrImages.length > 1 && (
          <div style={{ padding: '8px 22px', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
            {ocrImages.map((img, idx) => (
              <button key={idx} type="button"
                onClick={() => { setSelectedIdx(idx); setStartPt(null); setEndPt(null); setPreviewSvg(null); }}
                className={`btn btn-sm ${idx === selectedIdx ? 'btn-primary' : 'btn-ghost'}`}>
                Trang {idx + 1}
              </button>
            ))}
          </div>
        )}

        {/* Main area: image + SVG preview side by side */}
        <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: previewSvg ? '1fr 1fr' : '1fr', gap: 0, minHeight: 0 }}>
          {/* Image canvas */}
          <div style={{ padding: '16px', background: '#090d16', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto' }}>
            {activeImg ? (
              <div
                style={{ position: 'relative', display: 'inline-block', userSelect: 'none', cursor: 'crosshair' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <img ref={imgRef} src={activeImg.base64 || activeImg.url || activeImg} alt="Trang đề thi"
                  style={{ maxHeight: '62vh', display: 'block', borderRadius: '4px' }} draggable={false} />
                {box && (
                  <div style={{
                    position: 'absolute', left: box.left, top: box.top, width: box.width, height: box.height,
                    border: '2px solid #a78bfa', background: 'rgba(139,92,246,0.2)', pointerEvents: 'none',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)'
                  }} />
                )}
              </div>
            ) : <p style={{ color: 'var(--text-muted)' }}>Không có ảnh đề thi gốc.</p>}
          </div>

          {/* SVG Preview */}
          {previewSvg && (
            <div style={{ padding: '16px', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4ade80', margin: 0 }}>✅ AI đã vẽ lại hình — Xem trước:</p>
              <div style={{ background: '#fff', borderRadius: 8, padding: 12, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}
                dangerouslySetInnerHTML={{ __html: previewSvg }} />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>💡 Hình SVG sắc nét, scale tốt ở mọi kích thước. Chọn lại vùng khác nếu chưa đúng.</p>
            </div>
          )}
        </div>

        {/* Error */}
        {genError && <div style={{ padding: '8px 22px', color: '#f87171', fontSize: '0.82rem', background: 'rgba(248,113,113,0.1)' }}>⚠️ {genError}</div>}

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {box ? `Đã chọn vùng (${Math.round(box.width)}×${Math.round(box.height)}px)` : '💡 Click giữ chuột và kéo để khoanh vùng hình vẽ'}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Hủy</button>
            <button
              type="button" disabled={!box || generating}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', minWidth: 160 }}
              onClick={handleGenerateSVG}
            >
              {generating ? (<><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> AI đang vẽ... (~10s)</>) : '🎨 AI Vẽ hình SVG'}
            </button>
            {previewSvg && (
              <button type="button" className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                onClick={() => { onApply(previewSvg); onClose(); }}
              >
                ✅ Dùng hình này
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuestionEditor({ q, idx, onChange, onRemove, ocrSourceImages = [] }) {
  const [editingContent, setEditingContent] = useState(false);
  const [showFigureModal, setShowFigureModal] = useState(false);
  const [generatingFigure, setGeneratingFigure] = useState(false);
  const fileInputRef = useRef(null);

  const update = (key, val) => onChange({ ...q, [key]: val });
  const updateOption = (i, val) => {
    const opts = [...q.options];
    opts[i] = val;
    onChange({ ...q, options: opts });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { update('imageUrl', ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => { update('imageUrl', ev.target.result); };
        reader.readAsDataURL(file);
      }
    }
  };

  // Upload ảnh thủ công → gọi AI chuyển sang SVG
  const handleFileUploadToSVG = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setGeneratingFigure(true);
      try {
        const { data } = await api.post('/ai/figure-to-svg', {
          imageBase64: base64,
          mimeType: file.type || 'image/png',
          questionContent: q.content,
        });
        onChange({ ...q, svgFigure: data.svgCode, imageUrl: '' });
      } catch {
        // Fallback: dùng ảnh gốc nếu AI thất bại
        update('imageUrl', base64);
      } finally {
        setGeneratingFigure(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderContentArea = () => {
    if (q.contentIsHtml && !editingContent) {
      return (
        <div className="content-preview">
          <div className="content-html-render" dangerouslySetInnerHTML={{ __html: q.content }} />
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, fontSize: '0.75rem' }}
            onClick={() => setEditingContent(true)}>✏️ Chỉnh sửa nội dung</button>
        </div>
      );
    }
    return (
      <div className="content-preview">
        <textarea className="input content-textarea" rows={q.contentIsHtml ? 8 : 3}
          placeholder="Nhập nội dung câu hỏi..." value={q.content}
          onChange={e => update('content', e.target.value)}
          onBlur={() => q.contentIsHtml && setEditingContent(false)} />
        {q.contentIsHtml && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            ℹ️ Đang chỉnh sửa dạng HTML thô. Click ngoài textarea để xem trước.
          </p>
        )}
      </div>
    );
  };

  // Xác định hình nào đang hiển thị
  const hasFigure = !!(q.svgFigure || q.imageUrl);

  return (
    <div className="question-editor glass-card" onPaste={handlePaste}>
      <div className="question-editor-header">
        <span className="question-num">Câu {idx + 1}</span>
        {q.contentIsHtml && <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>HTML</span>}
        {q.svgFigure && <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', background: 'rgba(139,92,246,0.2)', color: '#a78bfa', borderRadius: 999, border: '1px solid rgba(139,92,246,0.4)' }}>AI SVG</span>}
        <select className="input" style={{ maxWidth: 200, fontSize: '0.8rem' }}
          value={q.type} onChange={e => update('type', e.target.value)}>
          <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
          <option value="MULTIPLE_CORRECT">Nhiều đáp án đúng</option>
          <option value="ESSAY">Tự luận</option>
        </select>
        <input type="number" className="input" style={{ maxWidth: 80 }}
          min="0.5" step="0.5" value={q.points}
          onChange={e => update('points', parseFloat(e.target.value) || 1)}
          placeholder="Điểm" />
        <button className="btn btn-danger btn-sm" onClick={onRemove}>✕ Xóa</button>
      </div>

      {renderContentArea()}

      {/* ── FIGURE SECTION ── */}
      <div style={{ marginTop: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        {hasFigure ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: q.svgFigure ? '#a78bfa' : 'var(--clr-primary-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {q.svgFigure ? '🎨 Hình vẽ AI (SVG vector)' : '🖼️ Hình ảnh đính kèm'}
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ocrSourceImages && ocrSourceImages.length > 0 && (
                  <button type="button" className="btn btn-outline btn-sm"
                    style={{ borderColor: 'rgba(139,92,246,0.5)', color: '#a78bfa' }}
                    onClick={() => setShowFigureModal(true)}>
                    🎨 AI Vẽ lại hình
                  </button>
                )}
                <button type="button" className="btn btn-danger btn-sm"
                  onClick={() => onChange({ ...q, svgFigure: '', imageUrl: '' })}>✕ Xóa hình</button>
              </div>
            </div>

            {/* Render SVG hoặc ảnh */}
            <div style={{ background: q.svgFigure ? '#fff' : '#000', padding: '12px', borderRadius: '6px', textAlign: 'center', maxHeight: 280, overflow: 'auto' }}>
              {q.svgFigure ? (
                <div dangerouslySetInnerHTML={{ __html: q.svgFigure }}
                  style={{ display: 'inline-block', maxWidth: '100%' }} />
              ) : (
                <img src={q.imageUrl} alt={`Minh họa câu ${idx + 1}`}
                  style={{ maxHeight: 240, maxWidth: '100%', objectFit: 'contain' }} />
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🖼️</span> Có hình ảnh minh họa (biển báo, sơ đồ, hình học...)?
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }}
                onChange={generatingFigure ? undefined : handleFileUploadToSVG} />
              <button type="button" className="btn btn-outline btn-sm"
                disabled={generatingFigure}
                onClick={() => fileInputRef.current?.click()}>
                {generatingFigure
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> AI đang vẽ...</>
                  : '📁 Tải ảnh → AI Vẽ SVG'}
              </button>
              {ocrSourceImages && ocrSourceImages.length > 0 && (
                <button type="button" className="btn btn-primary btn-sm"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                  onClick={() => setShowFigureModal(true)}>
                  🎨 AI Vẽ hình từ đề thi
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showFigureModal && createPortal(
        <AIFigureModal
          ocrImages={ocrSourceImages}
          onApply={(svgCode) => onChange({ ...q, svgFigure: svgCode, imageUrl: '' })}
          onClose={() => setShowFigureModal(false)}
        />,
        document.body
      )}

      {q.type !== 'ESSAY' ? (
        <div className="options-grid" style={{ marginTop: '12px' }}>
          {q.options.map((opt, i) => (
            <div key={i} className={`option-row ${q.correctAnswer === String(i) ? 'correct' : ''}`}>
              <button type="button"
                className={`option-bullet ${q.correctAnswer === String(i) ? 'active' : ''}`}
                onClick={() => update('correctAnswer', String(i))}>
                {String.fromCharCode(65 + i)}
              </button>
              <input className="input" placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                value={opt} onChange={e => updateOption(i, e.target.value)} />
            </div>
          ))}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', gridColumn: '1/-1' }}>
            💡 Click chữ cái (A/B/C/D) để đánh dấu đáp án đúng.
          </p>
        </div>
      ) : (
        <textarea className="input" rows={3} placeholder="Gợi ý đáp án (để AI sử dụng làm căn cứ chấm điểm)..."
          value={q.explanation} onChange={e => update('explanation', e.target.value)} />
      )}
    </div>
  );
}


const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};

export default function ExamForm({ initialMeta, initialQuestions = [], onBack, onSave, isEditMode = false, ocrSourceImages = [] }) {
  const [meta, setMeta] = useState(
    initialMeta
      ? {
          ...initialMeta,
          startAt: formatDateForInput(initialMeta.startAt),
          endAt: formatDateForInput(initialMeta.endAt),
        }
      : { title: '', subject: 'Toán', grade: 10, timeLimit: 45, description: '', startAt: '', endAt: '' }
  );
  const [questions, setQuestions] = useState(
    initialQuestions.length > 0 ? initialQuestions : [emptyQuestion()]
  );
  const [saving, setSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [error, setError] = useState('');

  const updateMeta = (k, v) => setMeta(m => ({ ...m, [k]: v }));
  const updateQ = (idx, q) => setQuestions(qs => qs.map((o, i) => i === idx ? q : o));
  const removeQ = (idx) => setQuestions(qs => qs.filter((_, i) => i !== idx));
  const addQ = () => setQuestions(qs => [...qs, emptyQuestion()]);

  const handleGenerateAnswersAI = async () => {
    const missingAnswers = questions.filter(
      q => (q.type !== 'ESSAY' && !q.correctAnswer) || (q.type === 'ESSAY' && !(q.explanation || '').trim())
    );

    if (missingAnswers.length === 0) {
      alert('Tất cả các câu hỏi đã có đáp án và gợi ý. Không cần AI hỗ trợ thêm.');
      return;
    }

    setIsGeneratingAI(true);
    setError('');
    try {
      const { data } = await api.post('/ai/generate-answers', { questions: missingAnswers });
      const generated = data.generatedAnswers || [];
      
      setQuestions(qs => qs.map(q => {
        const aiData = generated.find(g => g.id === q.id);
        if (!aiData) return q;
        return {
          ...q,
          correctAnswer: q.type !== 'ESSAY' ? (aiData.correctAnswer || q.correctAnswer) : q.correctAnswer,
          explanation: q.type === 'ESSAY' ? (aiData.explanation || q.explanation) : q.explanation,
        };
      }));
      alert('🎉 Đã sinh đáp án thành công cho ' + generated.length + ' câu hỏi!');
    } catch (e) {
      setError(e.response?.data?.message || 'Có lỗi xảy ra khi gọi AI.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveInternal = async (publish) => {
    if (!meta.title.trim()) { setError('Vui lòng nhập tên bài kiểm tra!'); return; }
    if (questions.length === 0) { setError('Bài kiểm tra cần có ít nhất 1 câu hỏi!'); return; }
    const emptyQ = questions.findIndex(q => !q.content.trim());
    if (emptyQ !== -1) { setError(`Câu ${emptyQ + 1} chưa có nội dung!`); return; }
    const noAnswerQ = questions.findIndex(q => q.type !== 'ESSAY' && !q.correctAnswer);
    if (noAnswerQ !== -1) { setError(`Câu ${noAnswerQ + 1} chưa chọn đáp án đúng!`); return; }

    setError('');
    setSaving(true);
    try {
      await onSave(meta, questions, publish);
    } catch (e) {
      setError(e.response?.data?.message || 'Không thể lưu bài kiểm tra. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← Quay lại</button>
          <h1 className="page-title" style={{ margin: 0 }}>{isEditMode ? 'Chỉnh sửa đề kiểm tra' : 'Soạn đề kiểm tra'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" disabled={saving} onClick={() => handleSaveInternal(false)}>
            💾 {isEditMode ? 'Cập nhật Nháp' : 'Lưu nháp'}
          </button>
          <button className="btn btn-primary" disabled={saving} onClick={() => handleSaveInternal(true)} id="btn-publish-exam">
            {saving ? <><span className="spinner" /> Đang lưu...</> : (isEditMode ? '🚀 Cập nhật & Xuất bản' : '🚀 Lưu & Xuất bản')}
          </button>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>⚠️ {error}</div>}

      <div className="glass-card exam-meta-form">
        <div className="meta-row">
          <div className="input-group" style={{ flex: 3 }}>
            <label className="input-label">Tên bài kiểm tra *</label>
            <input className="input" placeholder="VD: Kiểm tra 1 tiết Toán đại số"
              value={meta.title} onChange={e => updateMeta('title', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Môn học</label>
            <select className="input" value={meta.subject} onChange={e => updateMeta('subject', e.target.value)}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Khối lớp</label>
            <select className="input" value={meta.grade} onChange={e => updateMeta('grade', e.target.value)}>
              {GRADES.map(g => <option key={g} value={g}>Lớp {g}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Thời gian (phút)</label>
            <input type="number" className="input" min={5} max={300}
              value={meta.timeLimit} onChange={e => updateMeta('timeLimit', e.target.value)} />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Mô tả bài thi (không bắt buộc)</label>
          <input className="input" placeholder="VD: Kiểm tra chương 2 – Phương trình bậc 2"
            value={meta.description} onChange={e => updateMeta('description', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginTop: '4px' }}>
          <div className="input-group">
            <label className="input-label">Thời gian mở đề (không bắt buộc)</label>
            <input type="datetime-local" className="input"
              value={meta.startAt || ''} onChange={e => updateMeta('startAt', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Thời gian kết thúc (không bắt buộc)</label>
            <input type="datetime-local" className="input"
              value={meta.endAt || ''} onChange={e => updateMeta('endAt', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="section-heading">📋 Danh sách câu hỏi ({questions.length} câu)</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" disabled={isGeneratingAI} onClick={handleGenerateAnswersAI}>
              {isGeneratingAI ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : '✨'} Sinh đáp án bằng AI
            </button>
            <button className="btn btn-primary btn-sm" onClick={addQ} id="btn-add-question">
              ➕ Thêm câu hỏi
            </button>
          </div>
        </div>

        {questions.map((q, idx) => (
          <QuestionEditor key={q.id} q={q} idx={idx}
            onChange={(updated) => updateQ(idx, updated)}
            onRemove={() => removeQ(idx)}
            ocrSourceImages={ocrSourceImages} />
        ))}

        <button className="btn btn-outline" onClick={addQ} style={{ alignSelf: 'center', marginTop: 'var(--space-2)' }}>
          ➕ Thêm câu hỏi mới
        </button>
      </div>
    </div>
  );
}
