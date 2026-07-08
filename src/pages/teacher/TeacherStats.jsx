import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import api from '../../api/client';

const COLORS = ['#f43f5e', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'];

export default function TeacherStats() {
  const { examId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!examId) {
      setError('Vui lòng chọn một bài kiểm tra từ Bảng điều khiển để xem thống kê.');
      setLoading(false);
      return;
    }
    api.get(`/statistics/exam/${examId}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'Lỗi khi tải thống kê'))
      .finally(() => setLoading(false));
  }, [examId]);

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
            <Link to="/teacher" className="btn btn-primary" style={{ marginTop: '1rem' }}>Quay lại</Link>
          </div>
        </main>
      </div>
    );
  }

  const { exam, stats, submissions } = data;

  if (stats === null) {
    return (
      <div className="page-layout">
        <AnimatedBackground />
        <Sidebar />
        <main className="main-content">
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Chưa có dữ liệu</h2>
            <p>Bài kiểm tra này chưa có học sinh nào nộp bài.</p>
            <Link to="/teacher" className="btn btn-primary" style={{ marginTop: '1rem' }}>Quay lại</Link>
          </div>
        </main>
      </div>
    );
  }

  const distributionData = stats.distribution.map((count, i) => ({
    name: `${i * 10}-${i * 10 + 9}`,
    HọcSinh: count
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-deep)', padding: '10px', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--text-primary)' }}>Khoảng điểm: {label}</p>
          <p style={{ color: 'var(--clr-primary-400)' }}>Số lượng: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">📊 Thống kê: <span className="gradient-text">{exam.title}</span></h1>
            <p className="page-subtitle">Tổng quan điểm số và phát hiện đối phó.</p>
          </div>
          <Link to="/teacher" className="btn btn-outline">⬅ Quay lại</Link>
        </div>

        {/* Overview Stats */}
        <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="stat-card glass-card">
            <span className="stat-icon">👥</span>
            <span className="stat-value">{stats.totalSubmissions}</span>
            <span className="stat-label">Lượt nộp bài</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-icon">📈</span>
            <span className="stat-value">{stats.avgScore.toFixed(1)}</span>
            <span className="stat-label">Điểm trung bình (Hệ 100)</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-icon">⭐</span>
            <span className="stat-value">{stats.maxScore.toFixed(1)}</span>
            <span className="stat-label">Điểm cao nhất</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-icon">✅</span>
            <span className="stat-value">{stats.passRate}%</span>
            <span className="stat-label">Tỷ lệ đạt (≥ 50%)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          {/* Chart */}
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>Phổ điểm (Hệ 100)</h3>
            <div style={{ height: 300, width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="HọcSinh" fill="var(--clr-primary-500)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Anti-cheat summary */}
          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>🚩 Cảnh báo Đánh lụi / Đối phó</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: '0.9rem' }}>
              Dựa vào thuật toán phân tích thời gian thực: học sinh khoanh đáp án dưới 3 giây/câu nhưng có tỷ lệ lặp lại cao.
            </p>
            
            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
              {submissions.filter(s => {
                // Find if this submission has many fast answers
                const fastAnswers = s.answers?.filter(a => a.timeSpentSec > 0 && a.timeSpentSec < 3) || [];
                return fastAnswers.length > (exam.questions.length * 0.3); // > 30% questions answered under 3s
              }).length === 0 ? (
                <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: 8, color: 'var(--clr-emerald-500)', textAlign: 'center' }}>
                  ✅ Không phát hiện dấu hiệu bất thường.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Học sinh</th>
                      <th>Lần thi</th>
                      <th>Điểm</th>
                      <th>Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(s => {
                      const fastAnswers = s.answers?.filter(a => a.timeSpentSec > 0 && a.timeSpentSec < 3) || [];
                      if (fastAnswers.length <= (exam.questions.length * 0.3)) return null;
                      return (
                        <tr key={s.id} style={{ background: 'rgba(244,63,94,0.1)' }}>
                          <td>{s.user.name}</td>
                          <td>{s.attempt}</td>
                          <td><strong style={{ color: 'var(--clr-rose-500)' }}>{s.percentage?.toFixed(1)}%</strong></td>
                          <td>Khoanh {fastAnswers.length}/{exam.questions.length} câu dưới 3 giây</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Question Analysis */}
        <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>Thống kê từng câu hỏi</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Câu hỏi</th>
                  <th>Loại</th>
                  <th>Tỷ lệ đúng</th>
                  <th>Trung bình thời gian</th>
                  <th>Dấu hiệu lụi (&lt; 3s)</th>
                </tr>
              </thead>
              <tbody>
                {stats.questionStats.map(qs => (
                  <tr key={qs.questionId}>
                    <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Câu {qs.order}: <span dangerouslySetInnerHTML={/<[a-z][\s\S]*>/i.test(qs.content) ? { __html: qs.content } : undefined}>{!(/<[a-z][\s\S]*>/i.test(qs.content)) ? qs.content : undefined}</span>
                    </td>
                    <td>{qs.type === 'ESSAY' ? 'Tự luận' : 'Trắc nghiệm'}</td>
                    <td>
                      {qs.type === 'ESSAY' ? '--' : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ background: qs.correctRate >= 50 ? 'var(--clr-emerald-500)' : 'var(--clr-rose-500)', height: '100%', width: `${qs.correctRate}%` }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', width: 40 }}>{qs.correctRate.toFixed(1)}%</span>
                        </div>
                      )}
                    </td>
                    <td>{qs.avgTimeSpentSec}s</td>
                    <td>
                      {qs.suspiciousCount > 0 ? (
                        <span className="badge badge-danger">{qs.suspiciousCount} lượt</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0 lượt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
