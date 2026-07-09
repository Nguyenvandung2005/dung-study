import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import api from '../api/client';
import './Dashboard.css';

const getExamStatus = (exam) => {
  if (!exam.isPublished) return { text: 'Chưa phát hành', class: 'badge-danger' };
  const now = new Date();
  if (exam.startAt && new Date(exam.startAt) > now) return { text: 'Sắp mở', class: 'badge-warning' };
  if (exam.endAt && new Date(exam.endAt) < now) return { text: 'Đã đóng', class: 'badge-danger' };
  return { text: 'Đang mở', class: 'badge-success' };
};

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/statistics/teacher'),
      api.get('/exams'),
    ]).then(([statsRes, examsRes]) => {
      setStats(statsRes.data);
      setExams(examsRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePublish = async (id, isPublished) => {
    try {
      const { data } = await api.patch(`/exams/${id}/publish`, { isPublished: !isPublished });
      setExams(exams.map(e => e.id === id ? data : e));
    } catch (e) {
      alert('Không thể cập nhật trạng thái');
    }
  };

  const filteredExams = exams.filter(exam => {
    if (filterSubject && exam.subject !== filterSubject) return false;
    if (filterGrade && exam.grade !== parseInt(filterGrade)) return false;
    if (filterStatus === 'published' && !exam.isPublished) return false;
    if (filterStatus === 'draft' && exam.isPublished) return false;
    return true;
  });

  const uniqueSubjects = [...new Set(exams.map(e => e.subject))];

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content">
        <div className="page-header fade-in">
          <div>
            <h1 className="page-title">Bảng điều khiển <span className="gradient-text">Giáo viên</span> 👩‍🏫</h1>
            <p className="page-subtitle">Quản lý bài kiểm tra và theo dõi tiến độ của học sinh.</p>
          </div>
          <Link to="/teacher/create" className="btn btn-primary" id="btn-create-exam">
            ➕ Tạo đề kiểm tra mới
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* Stats overview */}
            <div className="stats-grid fade-in">
              <div className="stat-card glass-card">
                <span className="stat-icon">📝</span>
                <span className="stat-value">{stats?.totalExams || 0}</span>
                <span className="stat-label">Tổng số bài kiểm tra</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-icon">🟢</span>
                <span className="stat-value">{stats?.publishedExams || 0}</span>
                <span className="stat-label">Đang phát hành</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-icon">📥</span>
                <span className="stat-value">{stats?.totalSubmissions || 0}</span>
                <span className="stat-label">Lượt nộp bài</span>
              </div>
              <div className="stat-card glass-card">
                <span className="stat-icon">✏️</span>
                <span className="stat-value">{stats?.pendingGrading || 0}</span>
                <span className="stat-label">Đang chờ chấm (Tự luận)</span>
              </div>
            </div>

            {/* Exam Table list */}
            <section className="fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="section-header">
                <h2 className="section-heading">Danh sách bài thi của bạn</h2>
              </div>
              
              {exams.length > 0 && (
                <div className="glass-card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <select className="input" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ width: '180px' }}>
                    <option value="">Tất cả môn học</option>
                    {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  <select className="input" value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={{ width: '150px' }}>
                    <option value="">Tất cả khối</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                      <option key={g} value={String(g)}>Khối {g}</option>
                    ))}
                  </select>
                  <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '180px' }}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="published">Đã phát hành</option>
                    <option value="draft">Chưa phát hành</option>
                  </select>
                </div>
              )}

              {filteredExams.length === 0 ? (
                <div className="empty-state glass-card">
                  <span className="empty-icon">📝</span>
                  <p>Không tìm thấy bài kiểm tra nào phù hợp.</p>
                  {exams.length === 0 && <Link to="/teacher/create" className="btn btn-primary btn-sm">Tạo ngay</Link>}
                </div>
              ) : (
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tên bài thi</th>
                        <th>Môn học</th>
                        <th>Khối lớp</th>
                        <th>Thời gian</th>
                        <th>Số câu hỏi</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExams.map(exam => (
                        <tr key={exam.id}>
                          <td><strong>{exam.title}</strong></td>
                          <td><span className="badge badge-cyan">{exam.subject}</span></td>
                          <td>Lớp {exam.grade}</td>
                          <td>{exam.timeLimit} phút</td>
                          <td>{exam._count?.questions || 0} câu</td>
                          <td>
                            <button className={`badge ${getExamStatus(exam).class}`}
                              onClick={() => handlePublish(exam.id, exam.isPublished)}
                              style={{ border: 'none', cursor: 'pointer' }}>
                              {getExamStatus(exam).text}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Link to={`/teacher/statistics/${exam.id}`} className="btn btn-outline btn-sm">📊 Thống kê</Link>
                              <Link to={`/teacher/edit/${exam.id}`} className="btn btn-ghost btn-sm">Sửa</Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
