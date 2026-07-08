import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import api from '../../api/client';
import '../Dashboard.css';

export default function StudentExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/exams')
      .then(({ data }) => setExams(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = exams.filter(e =>
    !filter || e.subject.toLowerCase().includes(filter.toLowerCase()) || e.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">📝 Danh sách <span className="gradient-text">Bài kiểm tra</span></h1>
            <p className="page-subtitle">Chọn bài kiểm tra để bắt đầu làm.</p>
          </div>
        </div>

        {/* Filter */}
        <div className="glass-card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <input type="text" className="input" placeholder="Tìm kiếm theo tên bài hoặc môn học..."
            value={filter} onChange={e => setFilter(e.target.value)} />
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>Đang tải bài kiểm tra...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state glass-card">
            <span className="empty-icon">📭</span>
            <p>Chưa có bài kiểm tra nào phù hợp. Hãy thử tìm kiếm với từ khóa khác!</p>
          </div>
        ) : (
          <div className="cards-grid">
            {filtered.map(exam => (
              <div key={exam.id} className="exam-card glass-card">
                <div className="exam-card-header">
                  <span className="badge badge-cyan">{exam.subject}</span>
                  <span className="badge badge-primary">Lớp {exam.grade}</span>
                </div>
                <h3 className="exam-card-title">{exam.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {exam.description || 'Bài kiểm tra chính thức.'}
                </p>
                <div className="exam-card-meta">
                  <span>⏱️ {exam.timeLimit} phút</span>
                  <span>📋 {exam._count?.questions || 0} câu</span>
                  <span>👩‍🏫 {exam.createdBy?.name}</span>
                </div>
                <Link to={`/student/exam/${exam.id}`}
                  className="btn btn-primary"
                  style={{ marginTop: 'auto' }}
                  id={`start-exam-${exam.id}`}>
                  🚀 Bắt đầu làm bài
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
