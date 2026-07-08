import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/ui/Sidebar';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import api from '../api/client';
import './Dashboard.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/exams'),
      api.get('/submissions/history?limit=5'),
    ]).then(([examRes, histRes]) => {
      setExams(examRes.data.slice(0, 6));
      setHistory(histRes.data.slice(0, 5));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getScoreBadge = (pct) => {
    if (pct >= 80) return 'badge-success';
    if (pct >= 50) return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content">
        <div className="page-header fade-in">
          <div>
            <h1 className="page-title">Xin chào, <span className="gradient-text">{user?.name}</span> 👋</h1>
            <p className="page-subtitle">Lớp {user?.grade} — Hãy bắt đầu học tập hôm nay!</p>
          </div>
          <div className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            📚 Lớp {user?.grade}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>Đang tải...</p>
          </div>
        ) : (
          <>
            {/* Exams */}
            <section className="fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="section-header">
                <h2 className="section-heading">📝 Bài kiểm tra dành cho bạn</h2>
                <Link to="/student/exams" className="btn btn-ghost btn-sm">Xem tất cả →</Link>
              </div>
              {exams.length === 0 ? (
                <div className="empty-state glass-card">
                  <span className="empty-icon">📭</span>
                  <p>Chưa có bài kiểm tra nào. Hãy chờ giáo viên tạo bài nhé!</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {exams.map(exam => (
                    <div key={exam.id} className="exam-card glass-card">
                      <div className="exam-card-header">
                        <span className="badge badge-cyan">{exam.subject}</span>
                        <span className="badge badge-primary">Lớp {exam.grade}</span>
                      </div>
                      <h3 className="exam-card-title">{exam.title}</h3>
                      <div className="exam-card-meta">
                        <span>⏱️ {exam.timeLimit} phút</span>
                        <span>📋 {exam._count?.questions} câu</span>
                        <span>👩‍🏫 {exam.createdBy?.name}</span>
                      </div>
                      <Link to={`/student/exam/${exam.id}`} className="btn btn-primary" style={{ marginTop: 'auto' }} id={`start-exam-${exam.id}`}>
                        🚀 Bắt đầu làm bài
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* History */}
            {history.length > 0 && (
              <section className="fade-in" style={{ animationDelay: '0.2s', marginTop: 'var(--space-8)' }}>
                <div className="section-header">
                  <h2 className="section-heading">📊 Lịch sử làm bài gần đây</h2>
                  <Link to="/student/history" className="btn btn-ghost btn-sm">Xem tất cả →</Link>
                </div>
                <div className="history-list glass-card">
                  {history.map(sub => (
                    <div key={sub.id} className="history-item">
                      <div>
                        <p className="history-exam-name">{sub.exam?.title}</p>
                        <p className="history-meta">{sub.exam?.subject} • Lần {sub.attempt} • {new Date(sub.submittedAt || sub.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {sub.percentage !== null ? (
                          <span className={`badge ${getScoreBadge(sub.percentage)}`}>
                            {Math.round(sub.percentage)}%
                          </span>
                        ) : (
                          <span className="badge badge-warning">Chờ chấm</span>
                        )}
                        <Link to={`/student/result/${sub.id}`} className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }}>Xem lại</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
