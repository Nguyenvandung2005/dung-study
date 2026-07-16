import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import TimeFilter from '../../components/ui/TimeFilter';
import api from '../../api/client';


const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const COLORS = ['#f43f5e', '#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'];

function SubmissionDetailModal({ submission, exam, onClose }) {
  if (!submission || !exam) return null;
  const alphabet = ['A', 'B', 'C', 'D'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      backdropFilter: 'blur(8px)'
    }}>
      <div className="glass-card fade-in" style={{
        width: '100%', maxWidth: 850, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', background: 'rgba(30,41,59,0.8)', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>
              👤 Bài làm của <span style={{ color: 'var(--clr-primary-400)' }}>{submission.user?.name}</span>
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Đề thi: {exam.title} • Lần thi thứ {submission.attempt} • Nộp lúc: {submission.submittedAt ? formatDate(submission.submittedAt) : '--'}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ fontSize: '1.4rem', padding: '4px 12px' }}>✕</button>
        </div>

        {/* Score banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 24px',
          background: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>ĐIỂM SỐ</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--clr-emerald-500)' }}>
              {submission.totalScore?.toFixed(2) || 0} / {submission.maxScore || 10} ({submission.percentage?.toFixed(1) || 0}%)
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>THỜI GIAN LÀM</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              {submission.duration ? `${submission.duration} phút` : '--'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>CẢNH BÁO VI PHẠM</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: submission.cheatCount > 0 ? 'var(--clr-rose-500)' : 'var(--clr-emerald-500)' }}>
              {submission.cheatCount > 0 ? `🚨 ${submission.cheatCount} lần` : '✅ Sạch'}
            </div>
          </div>
        </div>

        {/* Questions scroll list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {exam.questions.map((q, idx) => {
            const ansObj = (submission.answers || []).find(a => a.questionId === q.id);
            const studentChoice = ansObj?.answer;
            const isCorrect = ansObj?.isCorrect;

            return (
              <div key={q.id} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', padding: '16px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--clr-primary-400)' }}>
                    Câu {idx + 1} ({q.points} điểm)
                  </span>
                  {q.type === 'ESSAY' ? (
                    <span className="badge badge-warning">Tự luận</span>
                  ) : isCorrect ? (
                    <span className="badge badge-success">✅ Đúng</span>
                  ) : (
                    <span className="badge badge-danger">❌ Sai</span>
                  )}
                </div>

                <div style={{ fontSize: '1.02rem', marginBottom: '12px', color: '#fff', lineHeight: 1.6 }}>
                  {q.content}
                </div>

                {q.imageUrl && (
                  <div style={{ marginBottom: '14px', textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8 }}>
                    <img src={q.imageUrl} alt={`Câu ${idx + 1}`} style={{ maxHeight: 260, maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                )}

                {q.type !== 'ESSAY' && Array.isArray(q.options) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    {q.options.map((opt, optIdx) => {
                      const optId = opt.id !== undefined ? String(opt.id) : String(optIdx);
                      const optText = typeof opt === 'object' ? opt.text : opt;
                      const isStudentChosen = Array.isArray(studentChoice)
                        ? studentChoice.includes(optId)
                        : String(studentChoice) === optId;
                      const isActualCorrect = Array.isArray(q.correctAnswer)
                        ? q.correctAnswer.includes(optId)
                        : String(q.correctAnswer) === optId;

                      let borderClr = 'rgba(255,255,255,0.1)';
                      let bgClr = 'transparent';
                      if (isActualCorrect) {
                        borderClr = '#10b981';
                        bgClr = 'rgba(16, 185, 129, 0.15)';
                      } else if (isStudentChosen && !isActualCorrect) {
                        borderClr = '#f43f5e';
                        bgClr = 'rgba(244, 63, 94, 0.15)';
                      }

                      return (
                        <div key={optIdx} style={{
                          padding: '10px 14px', borderRadius: 8, border: `1px solid ${borderClr}`, background: bgClr,
                          display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.92rem'
                        }}>
                          <span style={{ fontWeight: 700, color: isActualCorrect ? '#10b981' : '#fff' }}>
                            {alphabet[optIdx]}.
                          </span>
                          <span style={{ flex: 1 }}>{optText}</span>
                          {isActualCorrect && <span style={{ color: '#10b981', fontSize: '0.8rem' }}>✓ Đúng</span>}
                          {isStudentChosen && !isActualCorrect && <span style={{ color: '#f43f5e', fontSize: '0.8rem' }}>Chọn sai</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'ESSAY' && (
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: 12, borderRadius: 8, marginTop: 10 }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>BÀI LÀM CỦA HỌC SINH:</div>
                    <div style={{ color: '#fff', whiteSpace: 'pre-wrap' }}>
                      {studentChoice || 'Học sinh không làm câu này'}
                    </div>
                  </div>
                )}

                {q.explanation && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 8, fontSize: '0.88rem', color: '#93c5fd' }}>
                    💡 <strong>Lời giải:</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', background: 'rgba(30,41,59,0.8)', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} className="btn btn-primary">Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherStats() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subjectFilter = searchParams.get('subject');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeWarningTab, setActiveWarningTab] = useState('cheating');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [timeRange, setTimeRange] = useState({ type: 'all' });

  useEffect(() => {
    setLoading(true);
    setError('');
    const timeParams = `timeType=${timeRange.type}&timeStart=${timeRange.start || ''}&timeEnd=${timeRange.end || ''}`;
    
    if (!examId) {
      const url = subjectFilter ? `/statistics/global?subject=${encodeURIComponent(subjectFilter)}&${timeParams}` : `/statistics/global?${timeParams}`;
      api.get(url)
        .then(res => setData({ isGlobal: true, ...res.data }))
        .catch(err => setError(err.response?.data?.message || 'Lỗi khi tải thống kê tổng quan'))
        .finally(() => setLoading(false));
    } else {
      api.get(`/statistics/exam/${examId}?${timeParams}`)
        .then(res => setData({ isGlobal: false, ...res.data }))
        .catch(err => setError(err.response?.data?.message || 'Lỗi khi tải thống kê bài kiểm tra'))
        .finally(() => setLoading(false));
    }
  }, [examId, subjectFilter, timeRange]);

  if (loading && !data) {
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

  
  if (data.isGlobal) {
    return (
      <div className="page-layout">
        <AnimatedBackground />
        <Sidebar />
        <main className="main-content fade-in">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 className="page-title">
                🌍 Thống kê <span className="gradient-text">{subjectFilter ? `Môn ${subjectFilter}` : 'Tổng quan'}</span>
              </h1>
              <p className="page-subtitle">Dữ liệu phân tích toàn hệ thống bài kiểm tra của bạn.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <TimeFilter timeRange={timeRange} setTimeRange={setTimeRange} />
              {subjectFilter && (
                <button className="btn btn-outline" onClick={() => navigate('/teacher/statistics')}>
                  ✕ Bỏ lọc môn
                </button>
              )}
            </div>
          </div>

          <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="stat-card bento-card glow-border cascade-in" style={{ '--cascade-delay': '100ms', '--glow-color': '#f43f5e' }}>
              <span className="stat-icon">📚</span>
              <span className="stat-value">{data.totalExams}</span>
              <span className="stat-label">Tổng bài kiểm tra</span>
            </div>
            <div className="stat-card bento-card glow-border cascade-in" style={{ '--cascade-delay': '150ms', '--glow-color': '#fbbf24' }}>
              <span className="stat-icon">👥</span>
              <span className="stat-value">{data.totalSubmissions}</span>
              <span className="stat-label">Tổng lượt nộp bài</span>
            </div>
            <div className="stat-card bento-card glow-border cascade-in" style={{ '--cascade-delay': '200ms', '--glow-color': '#10b981' }}>
              <span className="stat-icon">📈</span>
              <span className="stat-value">{data.avgScore}</span>
              <span className="stat-label">Điểm trung bình (Hệ 100)</span>
            </div>
            <div className="stat-card bento-card glow-border cascade-in" style={{ '--cascade-delay': '250ms', '--glow-color': '#3b82f6' }}>
              <span className="stat-icon">🚨</span>
              <span className="stat-value">{data.totalCheating}</span>
              <span className="stat-label">Lượt vi phạm quy chế</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            <div className="bento-card glow-border cascade-in" style={{ '--cascade-delay': '300ms', '--glow-color': '#3b82f6', padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>📈 Xu hướng nộp bài (7 ngày qua)</h3>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--clr-primary-500)" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="var(--clr-primary-500)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)', borderRadius: 8, color: '#fff' }} />
                    <Area type="monotone" dataKey="Lượt_nộp" stroke="var(--clr-primary-500)" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bento-card glow-border cascade-in" style={{ '--cascade-delay': '350ms', '--glow-color': '#f43f5e', padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>📚 Cơ cấu Môn học</h3>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={data.subjectData} 
                      innerRadius={70} 
                      outerRadius={110} 
                      paddingAngle={5} 
                      dataKey="value" 
                      animationDuration={1500}
                      onClick={(data, index) => navigate(`/teacher/statistics?subject=${encodeURIComponent(data.name)}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {data.subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)', borderRadius: 8, color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            <div className="bento-card glow-border cascade-in" style={{ '--cascade-delay': '400ms', '--glow-color': '#10b981', padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>📊 Phổ điểm toàn cục (Hệ 100)</h3>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={data.scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="Học_sinh" fill="var(--clr-emerald-500)" radius={[6, 6, 0, 0]} animationDuration={1500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bento-card glow-border cascade-in" style={{ '--cascade-delay': '450ms', '--glow-color': '#d946ef', padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>🎯 Năng lực theo môn (Điểm TB)</h3>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer>
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.subjectPerformance}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                    <Radar name="Điểm TB" dataKey="Điểm_TB" stroke="var(--clr-fuchsia-500)" fill="var(--clr-fuchsia-500)" fillOpacity={0.4} animationDuration={1500} />
                    <Tooltip contentStyle={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)', borderRadius: 8, color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bento-card glow-border cascade-in" style={{ '--cascade-delay': '500ms', '--glow-color': '#8b5cf6', padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>🕒 Lịch sử nộp bài gần đây</h3>
            {data.recentSubmissions.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Học sinh</th>
                      <th>Bài kiểm tra</th>
                      <th>Thời gian nộp</th>
                      <th>Điểm số</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentSubmissions.map(sub => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 600 }}>{sub.student}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{sub.exam}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(sub.date)}</td>
                        <td>
                          <span className={`badge ${sub.score >= 80 ? 'badge-primary' : sub.score >= 50 ? 'badge-success' : 'badge-danger'}`}>
                            {sub.score?.toFixed(1) || 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Chưa có lượt nộp bài nào.</p>
            )}
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
          <div className="bento-card cascade-in" style={{ '--cascade-delay': '100ms', padding: '2rem', textAlign: 'center' }}>
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
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">📊 Thống kê: <span className="gradient-text">{exam.title}</span></h1>
            <p className="page-subtitle">Tổng quan điểm số và phát hiện đối phó.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <TimeFilter timeRange={timeRange} setTimeRange={setTimeRange} />
            <Link to="/teacher/statistics" className="btn btn-outline">⬅ Quay lại</Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="stat-card bento-card glow-border cascade-in" style={{ '--cascade-delay': '100ms', '--glow-color': '#fbbf24' }}>
            <span className="stat-icon">👥</span>
            <span className="stat-value">{stats.totalSubmissions}</span>
            <span className="stat-label">Lượt nộp bài</span>
          </div>
          <div className="stat-card bento-card glow-border cascade-in" style={{ '--cascade-delay': '150ms', '--glow-color': '#10b981' }}>
            <span className="stat-icon">📈</span>
            <span className="stat-value">{stats.avgScore.toFixed(1)}</span>
            <span className="stat-label">Điểm trung bình (Hệ 100)</span>
          </div>
          <div className="stat-card bento-card glow-border cascade-in" style={{ '--cascade-delay': '200ms', '--glow-color': '#3b82f6' }}>
            <span className="stat-icon">⭐</span>
            <span className="stat-value">{stats.maxScore.toFixed(1)}</span>
            <span className="stat-label">Điểm cao nhất</span>
          </div>
          <div className="stat-card bento-card glow-border cascade-in" style={{ '--cascade-delay': '250ms', '--glow-color': '#8b5cf6' }}>
            <span className="stat-icon">✅</span>
            <span className="stat-value">{stats.passRate}%</span>
            <span className="stat-label">Tỷ lệ đạt (≥ 50%)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          {/* Chart */}
          <div className="bento-card glow-border cascade-in" style={{ '--cascade-delay': '300ms', '--glow-color': '#10b981', padding: 'var(--space-6)' }}>
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
          <div className="bento-card glow-border cascade-in" style={{ '--cascade-delay': '350ms', '--glow-color': '#f43f5e', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <button 
                type="button"
                className={`btn btn-sm ${activeWarningTab === 'cheating' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '8px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => setActiveWarningTab('cheating')}
              >
                🚫 Cảnh báo Vi phạm Màn hình
              </button>
              <button 
                type="button"
                className={`btn btn-sm ${activeWarningTab === 'guessing' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '8px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => setActiveWarningTab('guessing')}
              >
                ⚡ Cảnh báo Đánh lụi (&lt; 3s)
              </button>
            </div>

            {activeWarningTab === 'cheating' ? (
              <>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: '0.88rem' }}>
                  Phát hiện học sinh thoát chế độ Toàn màn hình hoặc chuyển tab để truy cập phần mềm/trang web khác.
                </p>
                <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                  {submissions.filter(s => s.cheatCount > 0).length === 0 ? (
                    <div style={{ padding: '2rem 1rem', background: 'rgba(16,185,129,0.1)', borderRadius: 8, color: 'var(--clr-emerald-500)', textAlign: 'center', fontWeight: 'bold' }}>
                      ✅ Không phát hiện vi phạm màn hình nào.
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Học sinh</th>
                          <th>Lần thi</th>
                          <th>Điểm</th>
                          <th>Số lần vi phạm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.filter(s => s.cheatCount > 0).map(s => (
                          <tr key={s.id} style={{ background: 'rgba(244,63,94,0.15)' }}>
                            <td><strong>{s.user.name}</strong></td>
                            <td>Lần {s.attempt}</td>
                            <td><strong style={{ color: 'var(--clr-rose-500)' }}>{s.percentage?.toFixed(1)}%</strong></td>
                            <td>
                              <span className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '4px 8px' }}>
                                🚨 {s.cheatCount} lần vi phạm
                              </span>
                              {s.cheatLogs && Array.isArray(s.cheatLogs) && s.cheatLogs.length > 0 && (
                                <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  {s.cheatLogs.map((log, idx) => (
                                    <li key={idx} style={{ marginBottom: '4px' }}>{log}</li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: '0.88rem' }}>
                  Dựa vào thuật toán phân tích thời gian thực: học sinh khoanh đáp án dưới 3 giây/câu nhưng có tỷ lệ lặp lại cao.
                </p>
                <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                  {submissions.filter(s => {
                    const fastAnswers = s.answers?.filter(a => a.timeSpentSec > 0 && a.timeSpentSec < 3) || [];
                    return fastAnswers.length > (exam.questions.length * 0.3);
                  }).length === 0 ? (
                    <div style={{ padding: '2rem 1rem', background: 'rgba(16,185,129,0.1)', borderRadius: 8, color: 'var(--clr-emerald-500)', textAlign: 'center', fontWeight: 'bold' }}>
                      ✅ Không phát hiện dấu hiệu đánh lụi.
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
                            <tr key={s.id} style={{ background: 'rgba(251,191,36,0.15)' }}>
                              <td><strong>{s.user.name}</strong></td>
                              <td>Lần {s.attempt}</td>
                              <td><strong style={{ color: 'var(--clr-rose-500)' }}>{s.percentage?.toFixed(1)}%</strong></td>
                              <td>Khoanh {fastAnswers.length}/{exam.questions.length} câu &lt; 3 giây</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Student Submissions List */}
        <div className="bento-card glow-border cascade-in" style={{ '--cascade-delay': '400ms', '--glow-color': '#3b82f6', padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: 'var(--space-6)' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>📋 Danh Sách Kết Quả Làm Bài Của Học Sinh ({submissions.length} lượt nộp)</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Xem chi tiết điểm số, thời gian làm bài và từng câu hỏi học sinh đã trả lời.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <input
                type="text"
                placeholder="🔍 Tìm theo tên hoặc email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="form-input"
                style={{ width: 220, padding: '6px 12px', fontSize: '0.88rem' }}
              />
              <button
                type="button"
                className={`btn btn-sm ${studentFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStudentFilter('ALL')}
              >
                Tất cả
              </button>
              <button
                type="button"
                className={`btn btn-sm ${studentFilter === 'PASS' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStudentFilter('PASS')}
              >
                Đạt ≥ 50%
              </button>
              <button
                type="button"
                className={`btn btn-sm ${studentFilter === 'FAIL' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStudentFilter('FAIL')}
              >
                Chưa đạt
              </button>
              <button
                type="button"
                className={`btn btn-sm ${studentFilter === 'CHEAT' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStudentFilter('CHEAT')}
              >
                🚨 Có vi phạm
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Học sinh</th>
                  <th>Lần thi</th>
                  <th>Thời gian nộp</th>
                  <th>Thời gian làm</th>
                  <th>Điểm số</th>
                  <th>Quy chế</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {submissions
                  .filter(s => {
                    const q = studentSearch.toLowerCase();
                    const matchName = (s.user?.name || '').toLowerCase().includes(q) || (s.user?.email || '').toLowerCase().includes(q);
                    if (!matchName) return false;
                    if (studentFilter === 'PASS' && (s.percentage || 0) < 50) return false;
                    if (studentFilter === 'FAIL' && (s.percentage || 0) >= 50) return false;
                    if (studentFilter === 'CHEAT' && (s.cheatCount || 0) === 0) return false;
                    return true;
                  })
                  .map((sub, idx) => (
                    <tr key={sub.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{sub.user?.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {sub.user?.email} {sub.user?.grade ? `• Lớp ${sub.user.grade}` : ''}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline">Lần {sub.attempt}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {sub.submittedAt ? formatDate(sub.submittedAt) : '--'}
                      </td>
                      <td>
                        {sub.duration ? `${sub.duration} phút` : '--'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: (sub.percentage || 0) >= 50 ? 'var(--clr-emerald-500)' : 'var(--clr-rose-500)' }}>
                          {sub.totalScore?.toFixed(2) || 0} / {sub.maxScore || 10}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          ({sub.percentage?.toFixed(1) || 0}%)
                        </div>
                      </td>
                      <td>
                        {sub.cheatCount > 0 ? (
                          <span className="badge badge-danger">🚨 {sub.cheatCount} lần vi phạm</span>
                        ) : (
                          <span className="badge badge-success">✅ Hợp lệ</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => setSelectedSubmission(sub)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          👁️ Xem bài làm
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Question Analysis */}
        <div className="bento-card glow-border cascade-in" style={{ '--cascade-delay': '450ms', '--glow-color': '#eab308', padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
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

        <SubmissionDetailModal
          submission={selectedSubmission}
          exam={exam}
          onClose={() => setSelectedSubmission(null)}
        />
      </main>
    </div>
  );
}
