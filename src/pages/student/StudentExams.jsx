import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import api from '../../api/client';
import '../Dashboard.css';

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

export default function StudentExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(user?.grade ? String(user.grade) : '');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    api.get('/exams')
      .then(({ data }) => setExams(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = exams.filter(e => {
    const matchSearch = !filter || e.subject.toLowerCase().includes(filter.toLowerCase()) || e.title.toLowerCase().includes(filter.toLowerCase());
    const matchGrade = !selectedGrade || String(e.grade) === selectedGrade;
    const matchSubject = !selectedSubject || e.subject === selectedSubject;
    return matchSearch && matchGrade && matchSubject;
  });

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
        <div className="glass-card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" className="input" placeholder="Tìm kiếm theo tên bài hoặc môn học..."
            style={{ flex: 1, minWidth: '200px' }}
            value={filter} onChange={e => setFilter(e.target.value)} />
          
          <select className="input" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={{ width: '150px' }}>
            <option value="">Tất cả Khối</option>
            {GRADES.map(g => <option key={g} value={String(g)}>Lớp {g}</option>)}
          </select>

          <select className="input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ width: '150px' }}>
            <option value="">Tất cả Môn</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          {(filter !== '' || selectedGrade !== '' || selectedSubject !== '') && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilter(''); setSelectedGrade(''); setSelectedSubject(''); }}>
              ✕ Xóa lọc
            </button>
          )}
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
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {exam.description || 'Bài kiểm tra chính thức.'}
                </p>
                <div className="exam-card-meta">
                  <span>⏱️ {exam.timeLimit} phút</span>
                  <span>📋 {exam._count?.questions || 0} câu</span>
                  <span>👩‍🏫 {exam.createdBy?.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <Link to={`/student/exam/${exam.id}`}
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    id={`start-exam-${exam.id}`}>
                    🚀 Bắt đầu làm bài
                  </Link>
                  <button
                    className="btn btn-outline"
                    title="Copy link bài thi"
                    style={{ padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      const link = `${window.location.origin}/student/exam/${exam.id}`;
                      navigator.clipboard.writeText(link).then(() => {
                        alert('Đã copy link bài thi: ' + link);
                      });
                    }}
                  >
                    🔗
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
