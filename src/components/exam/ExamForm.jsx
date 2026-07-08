import { useState } from 'react';
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
});

export function QuestionEditor({ q, idx, onChange, onRemove }) {
  const [editingContent, setEditingContent] = useState(false);
  const update = (key, val) => onChange({ ...q, [key]: val });
  const updateOption = (i, val) => {
    const opts = [...q.options];
    opts[i] = val;
    onChange({ ...q, options: opts });
  };

  const renderContentArea = () => {
    if (q.contentIsHtml && !editingContent) {
      return (
        <div className="content-preview">
          <div
            className="content-html-render"
            dangerouslySetInnerHTML={{ __html: q.content }}
          />
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 6, fontSize: '0.75rem' }}
            onClick={() => setEditingContent(true)}
          >
            ✏️ Chỉnh sửa nội dung
          </button>
        </div>
      );
    }
    return (
      <div className="content-preview">
        <textarea
          className="input content-textarea"
          rows={q.contentIsHtml ? 8 : 3}
          placeholder="Nhập nội dung câu hỏi..."
          value={q.content}
          onChange={e => update('content', e.target.value)}
          onBlur={() => q.contentIsHtml && setEditingContent(false)}
        />
        {q.contentIsHtml && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            ℹ️ Đang chỉnh sửa dạng HTML thô. Click ngoài textarea để xem trước.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="question-editor glass-card">
      <div className="question-editor-header">
        <span className="question-num">Câu {idx + 1}</span>
        {q.contentIsHtml && <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>HTML</span>}
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

      {q.type !== 'ESSAY' ? (
        <div className="options-grid">
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

export default function ExamForm({ initialMeta, initialQuestions = [], onBack, onSave, isEditMode = false }) {
  const [meta, setMeta] = useState(
    initialMeta || { title: '', subject: 'Toán', grade: 10, timeLimit: 45, description: '' }
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
            onRemove={() => removeQ(idx)} />
        ))}

        <button className="btn btn-outline" onClick={addQ} style={{ alignSelf: 'center', marginTop: 'var(--space-2)' }}>
          ➕ Thêm câu hỏi mới
        </button>
      </div>
    </div>
  );
}
