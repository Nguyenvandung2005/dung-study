import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import '../Dashboard.css';

export default function StudentTakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState({});
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  const activeQuestionRef = useRef(null);
  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);

  // Initialize Exam
  useEffect(() => {
    let isMounted = true;
    api.post('/submissions/start', { examId })
      .then(({ data }) => {
        if (!isMounted) return;
        setExam(data.exam);
        setSubmissionId(data.submission.id);
        if (data.exam.timeLimit) {
          setTimeRemaining(data.exam.timeLimit * 60);
        }
        if (data.exam.questions?.length > 0) {
          setActiveQuestionId(data.exam.questions[0].id);
          activeQuestionRef.current = data.exam.questions[0].id;
        }
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.response?.data?.message || 'Lỗi khi tải đề thi');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [examId]);

  // Global Timer
  useEffect(() => {
    if (timeRemaining === null || submitting) return;
    if (timeRemaining <= 0) {
      handleSubmit(); // auto submit
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeRemaining, submitting]);

  // Per-question timer
  useEffect(() => {
    if (!activeQuestionId || submitting) return;
    questionTimerRef.current = setInterval(() => {
      setTimeSpent(prev => ({
        ...prev,
        [activeQuestionId]: (prev[activeQuestionId] || 0) + 1
      }));
    }, 1000);
    return () => clearInterval(questionTimerRef.current);
  }, [activeQuestionId, submitting]);

  const handleSelectAnswer = (qId, optionId, type) => {
    if (type === 'SINGLE_CHOICE') {
      setAnswers(prev => ({ ...prev, [qId]: optionId }));
    }
  };

  const handleEssayChange = (qId, text) => {
    setAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (window.confirm('Bạn có chắc chắn muốn nộp bài?')) {
      executeSubmit();
    }
  };

  const executeSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/submissions/${submissionId}/submit`, {
        answers,
        timeSpentPerQuestion: timeSpent
      });
      // Navigate to result
      navigate(`/student/result/${data.submissionId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi nộp bài');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedBackground />
        <div className="spinner" style={{ width: 48, height: 48 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedBackground />
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>❌ Không thể làm bài</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/student/exams')} style={{ marginTop: '1rem' }}>Quay lại</button>
        </div>
      </div>
    );
  }

  const formatTime = (sec) => {
    if (sec === null) return '--:--';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="page-layout">
      <AnimatedBackground />
      
      {/* Sidebar for Navigation */}
      <aside className="sidebar" style={{ width: 300, position: 'fixed', right: 0, left: 'auto', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: '2rem', color: timeRemaining < 60 ? 'var(--clr-rose-500)' : 'var(--text-primary)' }}>
            ⏱️ {formatTime(timeRemaining)}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Thời gian còn lại</p>
        </div>
        
        <div className="divider" />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, overflowY: 'auto' }}>
          {exam.questions.map((q, i) => {
            const isAnswered = !!answers[q.id];
            const isActive = activeQuestionId === q.id;
            return (
              <a 
                href={`#q-${q.id}`}
                key={q.id}
                onClick={() => setActiveQuestionId(q.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 36, borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer',
                  background: isActive ? 'var(--clr-primary-500)' : isAnswered ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isActive ? 'var(--clr-primary-400)' : isAnswered ? 'var(--clr-emerald-500)' : 'var(--border-subtle)'}`,
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  textDecoration: 'none'
                }}
              >
                {i + 1}
              </a>
            );
          })}
        </div>

        <div className="divider" />
        
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '1rem', background: 'var(--gradient-cyan)' }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Đang chấm điểm...' : '✅ Nộp bài ngay'}
        </button>
      </aside>

      {/* Main Exam Content */}
      <main className="main-content fade-in" style={{ marginRight: 300, marginLeft: 0, padding: 'var(--space-6)' }}>
        <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <h1 className="page-title">{exam.title}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{exam.subject} • Lớp {exam.grade}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {exam.questions.map((q, index) => (
            <div 
              key={q.id} 
              id={`q-${q.id}`}
              className="glass-card" 
              style={{ padding: 'var(--space-6)', borderLeft: activeQuestionId === q.id ? '4px solid var(--clr-primary-400)' : '' }}
              onMouseEnter={() => setActiveQuestionId(q.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ color: 'var(--clr-primary-400)' }}>Câu {index + 1} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({q.points} điểm)</span></h3>
                {q.type === 'ESSAY' && <span className="badge badge-warning">Tự luận</span>}
              </div>
              
              <div 
                className="question-content" 
                style={{ fontSize: '1.1rem', marginBottom: 'var(--space-6)' }}
                dangerouslySetInnerHTML={/<[a-z][\s\S]*>/i.test(q.content) ? { __html: q.content } : undefined}
              >
                {!(/<[a-z][\s\S]*>/i.test(q.content)) ? q.content : undefined}
              </div>

              {q.type === 'SINGLE_CHOICE' && q.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {q.options.map(opt => {
                    const selected = answers[q.id] === opt.id;
                    return (
                      <div 
                        key={opt.id}
                        onClick={() => handleSelectAnswer(q.id, opt.id, 'SINGLE_CHOICE')}
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${selected ? 'var(--clr-primary-500)' : 'var(--border-subtle)'}`,
                          background: selected ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          display: 'flex', gap: '1rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontWeight: 'bold', color: selected ? 'var(--clr-primary-400)' : 'var(--text-secondary)' }}>{opt.id}.</span>
                        <span>{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'ESSAY' && (
                <textarea 
                  className="input"
                  style={{ minHeight: '150px', resize: 'vertical' }}
                  placeholder="Nhập câu trả lời của bạn..."
                  value={answers[q.id] || ''}
                  onChange={e => handleEssayChange(q.id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
