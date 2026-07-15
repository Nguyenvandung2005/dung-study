import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/ui/Sidebar';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import api from '../api/client';
import './Dashboard.css';

const SUBJECTS = ['Toán', 'Văn', 'Anh', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa', 'GDCD', 'Tin học', 'Khác'];
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

const SUBJECT_ICONS = {
  'Toán': '📐',
  'Văn': '📖',
  'Anh': '🇬🇧',
  'Lý': '⚡',
  'Hóa': '🧪',
  'Sinh': '🌱',
  'Sử': '⏳',
  'Địa': '🌍',
  'GDCD': '⚖️',
  'Tin học': '💻',
  'Khác': '📝'
};

const getSubjectIcon = (sub) => SUBJECT_ICONS[sub] || '📝';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [allExams, setAllExams] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState(user?.grade ? String(user.grade) : '');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/exams'),
      api.get('/submissions/history'),
    ]).then(([examRes, histRes]) => {
      setAllExams(examRes.data);
      setAllHistory(histRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getScoreBadge = (pct) => {
    if (pct >= 80) return 'badge-success';
    if (pct >= 50) return 'badge-warning';
    return 'badge-danger';
  };

  const totalSubmissions = allHistory.length;
  const gradedSubmissions = allHistory.filter(h => h.percentage !== null);
  const averageScore = gradedSubmissions.length > 0
    ? Math.round(gradedSubmissions.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / gradedSubmissions.length)
    : 0;
  const pendingGrading = allHistory.filter(h => h.percentage === null).length;

  const recentHistory = allHistory.slice(0, 5);

  const filteredExams = allExams.filter(exam => {
    const matchGrade = !selectedGrade || String(exam.grade) === selectedGrade;
    const matchSubject = !selectedSubject || exam.subject === selectedSubject;
    return matchGrade && matchSubject;
  });

  const displayedExams = filteredExams.slice(0, 6);

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
            {/* Stats Overview */}
            <div className="stats-grid fade-in" style={{ marginBottom: 'var(--space-8)' }}>
              <div className="stat-card glass-card">
                <span className="stat-icon">📝</span>
                <span className="stat-value">{totalSubmissions}</span>
                <span className="stat-label">Bài thi đã làm</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-icon">🏆</span>
                <span className="stat-value" style={{ color: averageScore >= 80 ? '#34d399' : averageScore >= 50 ? '#fbbf24' : '#fb7185' }}>
                  {averageScore}%
                </span>
                <span className="stat-label">Điểm trung bình</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-icon">✅</span>
                <span className="stat-value">{gradedSubmissions.length}</span>
                <span className="stat-label">Bài đã hoàn thành</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-icon">⏳</span>
                <span className="stat-value" style={{ color: 'var(--clr-primary-400)' }}>{pendingGrading}</span>
                <span className="stat-label">Bài chờ chấm điểm</span>
              </div>
            </div>

            {/* Exams */}
            <section className="fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="section-header" style={{ marginBottom: 'var(--space-3)' }}>
                <h2 className="section-heading">📝 Bài kiểm tra dành cho bạn</h2>
                <Link to="/student/exams" className="btn btn-ghost btn-sm">Xem tất cả →</Link>
              </div>

              {/* Filters */}
              <div className="glass-card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-5)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Bộ lọc:</span>
                  <select className="input" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={{ width: '130px', padding: '8px 12px' }}>
                    <option value="">Tất cả Khối</option>
                    {GRADES.map(g => <option key={g} value={String(g)}>Lớp {g}</option>)}
                  </select>
                  <select className="input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ width: '130px', padding: '8px 12px' }}>
                    <option value="">Tất cả Môn</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {(selectedGrade !== '' || selectedSubject !== '') && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedGrade(''); setSelectedSubject(''); }} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                    ✕ Xóa bộ lọc
                  </button>
                )}
              </div>

              {allExams.length === 0 ? (
                <div className="empty-state glass-card">
                  <span className="empty-icon">📭</span>
                  <p>Chưa có bài kiểm tra nào. Hãy chờ giáo viên tạo bài nhé!</p>
                </div>
              ) : displayedExams.length === 0 ? (
                <div className="empty-state glass-card">
                  <span className="empty-icon">🔍</span>
                  <p>Không có bài kiểm tra nào phù hợp với bộ lọc hiện tại.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {displayedExams.map(exam => (
                    <div key={exam.id} className="exam-card glass-card" style={{ position: 'relative', overflow: 'hidden', paddingTop: 'var(--space-6)' }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                        background: exam.subject === 'Toán' ? 'linear-gradient(90deg, #ec4899, #eab308)' :
                          exam.subject === 'Văn' ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)' :
                            exam.subject === 'Anh' ? 'linear-gradient(90deg, #10b981, #3b82f6)' :
                              'var(--gradient-primary)'
                      }} />
                      <div className="exam-card-header">
                        <span className="badge badge-cyan">{getSubjectIcon(exam.subject)} {exam.subject}</span>
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
            {recentHistory.length > 0 && (
              <section className="fade-in" style={{ animationDelay: '0.2s', marginTop: 'var(--space-8)' }}>
                <div className="section-header">
                  <h2 className="section-heading">📊 Lịch sử làm bài gần đây</h2>
                  <Link to="/student/history" className="btn btn-ghost btn-sm">Xem tất cả →</Link>
                </div>
                <div className="history-list glass-card">
                  {recentHistory.map(sub => (
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
