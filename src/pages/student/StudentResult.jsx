import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import Sidebar from '../../components/ui/Sidebar';
import '../Dashboard.css';

export default function StudentResult() {
  const { submissionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/submissions/${submissionId}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'Lỗi tải kết quả'))
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (loading) {
    return (
      <div className="page-layout">
        <AnimatedBackground />
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="spinner" style={{ width: 48, height: 48 }} />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-layout">
        <AnimatedBackground />
        <Sidebar />
        <main className="main-content">
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>❌ {error}</h2>
            <Link to="/student/history" className="btn btn-primary" style={{ marginTop: '1rem' }}>Quay lại lịch sử</Link>
          </div>
        </main>
      </div>
    );
  }

  const { exam, answers, totalScore, maxScore, percentage, status } = data;

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">📊 Kết quả: <span className="gradient-text">{exam.title}</span></h1>
            <p className="page-subtitle">{exam.subject} • Lớp {exam.grade}</p>
          </div>
          <Link to="/student/history" className="btn btn-outline">⬅ Quay lại Lịch sử</Link>
        </div>

        {/* Score Overview */}
        <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', textAlign: 'center', background: 'linear-gradient(135deg, rgba(244,63,94,0.1), rgba(16,185,129,0.1))' }}>
          <h2 style={{ fontSize: '3.5rem', marginBottom: 'var(--space-2)', color: 'var(--clr-primary-400)' }}>
            {totalScore ?? 0} <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>/ {maxScore}</span>
          </h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: (percentage ?? 0) >= 50 ? 'var(--clr-emerald-500)' : 'var(--clr-rose-500)' }}>
            Tỷ lệ hoàn thành: {percentage != null ? percentage.toFixed(1) : 0}%
          </p>
          <div style={{ marginTop: 'var(--space-3)' }}>
            <span className={`badge ${status === 'GRADED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '1rem', padding: '6px 12px' }}>
              {status === 'GRADED' ? 'Đã chấm xong' : 'Chờ chấm tự luận'}
            </span>
          </div>
        </div>

        {/* Detailed Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {exam.questions.map((q, index) => {
            const stuAnswer = answers.find(a => a.questionId === q.id);
            const isCorrect = stuAnswer?.isCorrect;
            const earned = stuAnswer?.scoreEarned ?? (stuAnswer?.teacherScore || stuAnswer?.aiScore || 0);

            return (
              <div key={q.id} className="glass-card" style={{ padding: 'var(--space-6)', borderLeft: `4px solid ${q.type === 'ESSAY' ? 'var(--clr-amber-500)' : isCorrect ? 'var(--clr-emerald-500)' : 'var(--clr-rose-500)'}` }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ color: 'var(--text-primary)' }}>
                    Câu {index + 1}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 8 }}>({earned} / {q.points} điểm)</span>
                  </h3>
                  {q.type === 'ESSAY' ? (
                    <span className="badge badge-warning">Tự luận</span>
                  ) : (
                    <span className={`badge ${isCorrect ? 'badge-success' : 'badge-danger'}`}>
                      {isCorrect ? '✅ Đúng' : '❌ Sai'}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div 
                  className="question-content" 
                  style={{ fontSize: '1.1rem', marginBottom: 'var(--space-6)' }}
                  dangerouslySetInnerHTML={/<[a-z][\s\S]*>/i.test(q.content) ? { __html: q.content } : undefined}
                >
                  {!(/<[a-z][\s\S]*>/i.test(q.content)) ? q.content : undefined}
                </div>

                {/* MCQ Options */}
                {q.type === 'SINGLE_CHOICE' && q.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {q.options.map(opt => {
                      const isSelected = stuAnswer?.answer === opt.id;
                      const isActuallyCorrect = q.correctAnswer?.includes(opt.id);
                      
                      let bg = 'rgba(255,255,255,0.02)';
                      let border = 'var(--border-subtle)';
                      let icon = '';

                      if (exam.showAnswerAfter) {
                        if (isActuallyCorrect) {
                          bg = 'rgba(16,185,129,0.15)';
                          border = 'var(--clr-emerald-500)';
                          icon = '✅';
                        } else if (isSelected) {
                          bg = 'rgba(244,63,94,0.15)';
                          border = 'var(--clr-rose-500)';
                          icon = '❌';
                        }
                      } else {
                        if (isSelected) {
                          bg = 'rgba(244,63,94,0.1)';
                          border = 'var(--clr-primary-500)';
                        }
                      }

                      return (
                        <div key={opt.id} style={{
                          padding: 'var(--space-3) var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${border}`,
                          background: bg,
                          display: 'flex', gap: '1rem', alignItems: 'center'
                        }}>
                          <span style={{ fontWeight: 'bold', minWidth: '24px' }}>{opt.id}.</span>
                          <span style={{ flex: 1 }}>{opt.text}</span>
                          {icon && <span>{icon}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Essay Answer */}
                {q.type === 'ESSAY' && (
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Bài làm của bạn:</h4>
                    <div style={{ padding: 'var(--space-4)', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap' }}>
                      {stuAnswer?.answer || <span style={{ color: 'var(--text-muted)' }}>(Không có câu trả lời)</span>}
                    </div>

                    {/* AI / Teacher Remark */}
                    {(stuAnswer?.aiRemark || stuAnswer?.teacherRemark) && (
                      <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.3)' }}>
                        <h4 style={{ fontSize: '0.95rem', color: '#fbbf24', marginBottom: '8px' }}>
                          🤖 {stuAnswer?.teacherRemark ? 'Nhận xét của Giáo viên' : 'Nhận xét của AI'}:
                        </h4>
                        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{stuAnswer?.teacherRemark || stuAnswer?.aiRemark}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {exam.showAnswerAfter && q.explanation && (!isCorrect || q.type === 'ESSAY') && (
                  <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'rgba(244,63,94,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--clr-primary-400)', marginBottom: '8px' }}>💡 Giải thích / Gợi ý:</h4>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{q.explanation}</p>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
