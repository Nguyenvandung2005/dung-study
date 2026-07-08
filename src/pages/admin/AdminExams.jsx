import { useEffect, useState } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import api from '../../api/client';

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = () => {
    setLoading(true);
    api.get('/exams')
      .then(({ data }) => setExams(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTogglePublish = async (id, isPublished) => {
    try {
      await api.patch(`/exams/${id}/publish`, { isPublished: !isPublished });
      setExams(exams.map(e => e.id === id ? { ...e, isPublished: !isPublished } : e));
    } catch (e) {
      alert('Không thể cập nhật trạng thái bài thi');
    }
  };

  const handleDeleteExam = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này?')) return;
    try {
      await api.delete(`/exams/${id}`);
      setExams(exams.filter(e => e.id !== id));
    } catch (e) {
      alert('Không thể xóa bài thi');
    }
  };

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Quản lý <span className="gradient-text">Bài kiểm tra</span> 📝</h1>
            <p className="page-subtitle">Giám sát, kích hoạt hoặc xóa các đề kiểm tra K1-K12 trên toàn hệ thống.</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>Đang tải danh sách bài kiểm tra...</p>
          </div>
        ) : (
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên bài thi</th>
                  <th>Môn học</th>
                  <th>Khối lớp</th>
                  <th>Thời lượng</th>
                  <th>Số câu hỏi</th>
                  <th>Người tạo</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>Chưa có bài kiểm tra nào được tạo.</td>
                  </tr>
                ) : (
                  exams.map(e => (
                    <tr key={e.id}>
                      <td><strong>{e.title}</strong></td>
                      <td><span className="badge badge-cyan">{e.subject}</span></td>
                      <td>Lớp {e.grade}</td>
                      <td>{e.timeLimit} phút</td>
                      <td>{e._count?.questions || 0} câu</td>
                      <td>{e.createdBy?.name || 'Admin'}</td>
                      <td>
                        <button className={`badge ${e.isPublished ? 'badge-success' : 'badge-danger'}`}
                          onClick={() => handleTogglePublish(e.id, e.isPublished)}
                          style={{ border: 'none', cursor: 'pointer' }}>
                          {e.isPublished ? 'Đang mở' : 'Đang đóng'}
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteExam(e.id)}>
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
