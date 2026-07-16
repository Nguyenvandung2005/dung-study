import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import TimeFilter from '../../components/ui/TimeFilter';
import api from '../../api/client';
import '../Dashboard.css';

export default function StudentHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState({ type: 'all' });

  useEffect(() => {
    setLoading(true);
    const timeParams = `?timeType=${timeRange.type}&timeStart=${timeRange.start || ''}&timeEnd=${timeRange.end || ''}`;
    api.get(`/submissions/history${timeParams}`)
      .then(({ data }) => setHistory(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [timeRange]);

  const getScoreClass = (pct) => {
    if (pct === null || pct === undefined) return 'badge-warning';
    if (pct >= 80) return 'badge-success';
    if (pct >= 50) return 'badge-warning';
    return 'badge-danger';
  };

  const getScoreLabel = (pct) => {
    if (pct === null || pct === undefined) return 'Chờ chấm';
    return `${Math.round(pct)}%`;
  };

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">📊 Lịch sử <span className="gradient-text">Làm bài</span></h1>
            <p className="page-subtitle">Xem lại kết quả và đáp án đúng của các lần làm bài trước.</p>
          </div>
          <div>
            <TimeFilter timeRange={timeRange} setTimeRange={setTimeRange} />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>Đang tải lịch sử làm bài...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state bento-card cascade-in" style={{ '--cascade-delay': '200ms' }}>
            <span className="empty-icon">📭</span>
            <p>Bạn chưa làm bài kiểm tra nào. Hãy thử ngay!</p>
            <Link to="/student/exams" className="btn btn-primary btn-sm">Xem bài thi</Link>
          </div>
        ) : (
          <div className="bento-card glow-border cascade-in" style={{ '--cascade-delay': '150ms', '--glow-color': '#fb7185', overflowX: 'auto', padding: '12px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên bài kiểm tra</th>
                  <th>Môn học</th>
                  <th>Lần thử</th>
                  <th>Thời gian làm</th>
                  <th>Ngày nộp</th>
                  <th>Điểm</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {history.map(sub => (
                  <tr key={sub.id}>
                    <td><strong>{sub.exam?.title}</strong></td>
                    <td><span className="badge badge-cyan">{sub.exam?.subject}</span></td>
                    <td>Lần {sub.attempt}</td>
                    <td>{sub.timeTakenSec ? `${Math.floor(sub.timeTakenSec / 60)}p ${sub.timeTakenSec % 60}s` : '—'}</td>
                    <td>{new Date(sub.submittedAt || sub.createdAt).toLocaleString('vi-VN')}</td>
                    <td>
                      <span className={`badge ${getScoreClass(sub.percentage)}`}>
                        {getScoreLabel(sub.percentage)}
                      </span>
                    </td>
                    <td>
                      <Link to={`/student/result/${sub.id}`} className="btn btn-outline btn-sm">
                        🔍 Xem lại
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
