import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getFullUploadUrl } from '../../api/client';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import Sidebar from '../../components/ui/Sidebar';
import '../Dashboard.css';


const parseEssayAnswer = (answerText) => {
  if (!answerText) return { imageUrl: null, text: '' };
  const imgMatch = answerText.match(/\[Ảnh bài làm:\s*(.*?)\]/);
  if (imgMatch) {
    const imageUrl = imgMatch[1];
    const text = answerText.replace(/\[Ảnh bài làm:\s*.*?\]/, '').trim();
    return { imageUrl, text };
  }
  return { imageUrl: null, text: answerText };
};

export default function StudentResult() {
  const { submissionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studyPath, setStudyPath] = useState('');
  const [studyPathLoading, setStudyPathLoading] = useState(false);

  useEffect(() => {
    api.get(`/submissions/${submissionId}`)
      .then(res => {
        setData(res.data);
        fetchStudyPath(res.data);
      })
      .catch(err => setError(err.response?.data?.message || 'Lỗi tải kết quả'))
      .finally(() => setLoading(false));
  }, [submissionId]);

  const fetchStudyPath = async (resultData) => {
    if (!resultData?.exam) return;
    setStudyPathLoading(true);
    try {
      const wrongQuestions = (resultData.answers || [])
        .filter(a => a.isCorrect === false)
        .map(a => {
          const q = resultData.exam.questions?.find(q => q.id === a.questionId);
          return q ? q.content.replace(/<[^>]*>/g, '').trim().slice(0, 100) : null;
        })
        .filter(Boolean);

      const { data: aiData } = await api.post('/ai/analyze-student-result', {
        subject: resultData.exam.subject,
        grade: resultData.exam.grade,
        score: resultData.totalScore,
        maxScore: resultData.maxScore,
        wrongQuestions,
      });
      setStudyPath(aiData.analysis || '');
    } catch {
      // silence if AI unavailable
    } finally {
      setStudyPathLoading(false);
    }
  };


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

        {/* AI Study Path */}
        {(studyPathLoading || studyPath) && (
          <div className="glass-card fade-in" style={{
            padding: 'var(--space-6)', marginBottom: 'var(--space-6)',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))',
            border: '1px solid rgba(139,92,246,0.3)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💡</span>
              <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Lộ trình Ôn tập Cá nhân hóa bởi AI
              </span>
            </h3>
            {studyPathLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: '0.88rem' }}>AI đang phân tích kết quả và chuẩn bị gợi ý cho bạn...</span>
              </div>
            ) : (
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                {studyPath}
              </p>
            )}
          </div>
        )}

        {/* Detailed Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {exam.questions.map((q, index) => {
            const stuAnswer = answers.find(a => a.questionId === q.id);
            const isCorrect = stuAnswer?.isCorrect;
            const earned = stuAnswer?.scoreEarned ?? (stuAnswer?.teacherScore || stuAnswer?.aiScore || 0);
            
            const showSection = q.section && (index === 0 || q.section !== exam.questions[index - 1]?.section);

            return (
              <React.Fragment key={`wrap-${q.id}`}>
                {showSection && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '12px 20px', 
                    background: 'var(--gradient-primary)', 
                    borderRadius: 'var(--radius-md)', 
                    color: '#fff', 
                    fontWeight: 700, 
                    fontSize: '1.2rem', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {q.section}
                  </div>
                )}
                <div id={`q-${q.id}`} className="glass-card" style={{ padding: 'var(--space-6)', borderLeft: `4px solid ${q.type === 'ESSAY' ? 'var(--clr-amber-500)' : isCorrect ? 'var(--clr-emerald-500)' : 'var(--clr-rose-500)'}` }}>
                
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
                  style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}
                  dangerouslySetInnerHTML={q.content && /<[a-z][\s\S]*>/i.test(q.content) ? { __html: q.content } : undefined}
                >
                  {!(q.content && /<[a-z][\s\S]*>/i.test(q.content)) ? q.content : undefined}
                </div>

                {q.imageUrl && (
                  <div className="svg-wrapper-render" style={{ marginBottom: 'var(--space-6)', textAlign: 'center', background: q.imageUrl.startsWith('data:image/svg+xml,') ? '#fff' : 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                    {q.imageUrl.startsWith('data:image/svg+xml,') ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: decodeURIComponent(q.imageUrl.replace('data:image/svg+xml,', '')) }}
                        style={{ display: 'inline-block', maxWidth: '100%', width: '100%' }}
                      />
                    ) : (
                      <img
                        src={q.imageUrl}
                        alt={`Minh họa câu ${index + 1}`}
                        style={{
                          maxHeight: 380,
                          maxWidth: '100%',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                          objectFit: 'contain'
                        }}
                      />
                    )}
                  </div>
                )}

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
                          <span style={{ flex: 1 }}>
                            {opt.text}
                            {isSelected && (
                              <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: isActuallyCorrect ? 'var(--clr-emerald-500)' : 'var(--clr-rose-500)', fontWeight: 600 }}>
                                (Lựa chọn của bạn)
                              </span>
                            )}
                          </span>
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
                    <div style={{ padding: 'var(--space-4)', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
                      {(() => {
                        const { imageUrl, text } = parseEssayAnswer(stuAnswer?.answer);
                        return (
                          <>
                            {imageUrl && (
                              <div style={{ marginBottom: 'var(--space-4)' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '6px' }}>📷 Ảnh đính kèm:</p>
                                <a href={getFullUploadUrl(imageUrl)} target="_blank" rel="noreferrer">
                                  <img src={getFullUploadUrl(imageUrl)} alt="Ảnh bài làm" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', cursor: 'zoom-in' }} />
                                </a>
                              </div>
                            )}
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                              {text || (!imageUrl && <span style={{ color: 'var(--text-muted)' }}>(Không có câu trả lời)</span>)}
                            </p>
                          </>
                        );
                      })()}
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
              </React.Fragment>
            );
          })}
        </div>

        {/* AI Study Path Card */}
        <div className="glass-card fade-in" style={{
          padding: 'var(--space-6)',
          marginTop: 'var(--space-8)',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.08))',
          border: '1px solid rgba(16,185,129,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: '1.8rem' }}>💡</span>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#34d399', margin: 0 }}>Lộ trình Ôn tập Cá nhân hóa bởi AI</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Gemini AI phân tích kết quả và đề xuất hướng ôn tập dành riêng cho bạn</p>
            </div>
          </div>

          {studyPathLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ width: 22, height: 22 }} />
              <span style={{ fontSize: '0.9rem' }}>AI đang phân tích kết quả của bạn...</span>
            </div>
          ) : studyPath ? (
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
              borderLeft: '3px solid #34d399',
            }}>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                {studyPath}
              </p>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              ⚠️ Không thể tải phân tích AI lúc này. Tính năng này yêu cầu cấu hình Gemini API Key.
            </p>
          )}
        </div>

      </main>
    </div>
  );
}
