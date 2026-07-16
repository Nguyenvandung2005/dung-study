import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/ui/Sidebar';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import TimeFilter from '../components/ui/TimeFilter';
import api from '../api/client';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ChartLineUp, Medal, GraduationCap, ClipboardText, Target, ShieldCheck } from '@phosphor-icons/react';
import './Dashboard.css';

const getScoreBadge = (pct) => {
  if (pct >= 80) return 'badge-success';
  if (pct >= 50) return 'badge-warning';
  return 'badge-danger';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip glass-card">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="tooltip-item" style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [allExams, setAllExams] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState({ type: 'all' });

  const [selectedGrade, setSelectedGrade] = useState(user?.grade ? String(user.grade) : '');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/statistics/student', { params: timeRange }),
      api.get('/exams', { params: timeRange }),
      api.get('/submissions/history', { params: timeRange }),
    ]).then(([statsRes, examRes, histRes]) => {
      setStats(statsRes.data);
      setAllExams(examRes.data);
      setAllHistory(histRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [timeRange]);

  const recentHistory = allHistory.slice(0, 5);

  const filteredExams = allExams.filter(exam => {
    const matchGrade = !selectedGrade || String(exam.grade) === selectedGrade;
    const matchSubject = !selectedSubject || exam.subject === selectedSubject;
    return matchGrade && matchSubject;
  });

  const displayedExams = filteredExams.slice(0, 6);

  const progressData = stats?.progressData || [];
  const radarData = stats?.radarData || [];
  const donutData = stats?.donutData || [];

  const hasProgress = progressData.length > 0;
  const hasRadar = radarData.length > 0;
  const hasDonut = donutData.length > 0;

  return (
    <div className="page-layout bg-dot-grid">
      <AnimatedBackground />
      <Sidebar />

      <main className="main-content">
        <div className="admin-bento-container">
          <header className="bento-header cascade-in" style={{ '--cascade-delay': '0ms', position: 'relative', zIndex: 100 }}>
            <div>
              <h1 className="bento-title">Xin chào, <span className="gradient-text">{user?.name}</span> 👋</h1>
              <p className="bento-subtitle">Lớp {user?.grade} — Hãy bắt đầu học tập hôm nay!</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <TimeFilter timeRange={timeRange} setTimeRange={setTimeRange} />
              <div className="badge badge-primary glow-button" style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
                <GraduationCap size={18} weight="duotone" style={{ marginRight: '6px' }} />
                Lớp {user?.grade}
              </div>
            </div>
          </header>

          <div className="bento-grid">
            {/* Theme Showcase */}
            <div className="bento-span-7" style={{ display: 'flex' }}>
              <div className="bento-card theme-showcase cascade-in glow-border" style={{ '--cascade-delay': '50ms', '--glow-color': '#a78bfa', padding: 'var(--space-8)', flex: 1, minHeight: '300px', position: 'relative', overflow: 'hidden' }}>
                <div className="theme-showcase-bg" style={{ position: 'absolute', inset: 0, backgroundImage: "url('/student_bg.png')", backgroundSize: 'cover', backgroundPosition: 'center right', opacity: 0.85, zIndex: 0 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,15,25,0.98) 0%, rgba(10,15,25,0.8) 45%, rgba(10,15,25,0.1) 100%)', zIndex: 1 }}></div>
                <div className="theme-showcase-content" style={{ position: 'relative', zIndex: 2 }}>
                  <div className="theme-badge" style={{ color: '#a78bfa', borderColor: '#a78bfa40' }}><ShieldCheck size={16} weight="fill" /> Student Portal</div>
                  <h2 className="theme-title">Không gian Học tập Cyber</h2>
                  <p className="theme-desc">
                    Mở khóa tiềm năng của bạn. Truy cập vào kho đề thi khổng lồ, theo dõi sự tiến bộ và bứt phá giới hạn mỗi ngày.
                  </p>
                  <Link to="/student/exams" className="btn btn-primary theme-btn" style={{ background: '#a78bfa', color: '#0f172a' }}>
                    Vào phòng thi ngay
                  </Link>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="bento-span-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
              {[
                { icon: ClipboardText, value: stats?.totalSubmissions || 0, label: 'Bài thi đã làm', color: '#38bdf8' },
                { icon: Medal, value: stats?.averageScore || 0, label: 'Điểm trung bình', color: '#facc15' },
                { icon: Target, value: stats?.gradedSubmissions || 0, label: 'Đã hoàn thành', color: '#34d399' },
                { icon: ChartLineUp, value: (stats?.totalSubmissions || 0) - (stats?.gradedSubmissions || 0), label: 'Chờ chấm', color: '#fb7185' },
              ].map((stat, i) => (
                <div key={i} className="bento-card glow-border stat-card-modern cascade-in" style={{ '--cascade-delay': `${100 + i * 50}ms`, '--glow-color': stat.color, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="stat-icon-wrapper" style={{ background: `${stat.color}15`, color: stat.color, padding: '10px', borderRadius: '12px', width: 'fit-content' }}>
                    <stat.icon size={24} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="stat-value" style={{ fontSize: '2rem', marginBottom: '4px' }}>
                      {loading ? <div className="skeleton-pulse" style={{ width: '60px', height: '36px', borderRadius: '6px' }} /> : stat.value}
                    </h3>
                    <p className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart 1: Area Chart (Progress over time) */}
            <div className="bento-span-8 bento-card glow-border cascade-in" style={{ '--cascade-delay': '300ms', '--glow-color': '#38bdf8', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-top">
                <div className="panel-title-wrap">
                  <ChartLineUp size={20} weight="duotone" style={{ color: '#38bdf8' }} />
                  <h3>Tiến độ học tập</h3>
                </div>
              </div>
              <div className="chart-container" style={{ flex: 1, minHeight: '260px', marginTop: '16px', position: 'relative' }}>
                {!hasProgress ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <ChartLineUp size={48} weight="thin" style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Chưa có tiến độ nào</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="glowProgress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dx={-10} domain={[0, 100]} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="Điểm" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#glowProgress)" activeDot={{ r: 6, fill: '#38bdf8', stroke: 'rgba(56,189,248,0.4)', strokeWidth: 6 }} animationDuration={1500} animationEasing="ease-out" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Donut Chart (Status) */}
            <div className="bento-span-4 bento-card glow-border cascade-in" style={{ '--cascade-delay': '350ms', '--glow-color': '#facc15', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-top">
                <div className="panel-title-wrap">
                  <Medal size={20} weight="duotone" style={{ color: '#facc15' }} />
                  <h3>Phân loại kết quả</h3>
                </div>
              </div>
              <div className="chart-container" style={{ flex: 1, minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {!hasDonut ? (
                  <div style={{ position: 'absolute', inset: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Medal size={48} weight="thin" style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Chưa có kết quả</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Radar Chart (Subject Strength) */}
            <div className="bento-span-12 bento-card glow-border cascade-in" style={{ '--cascade-delay': '400ms', '--glow-color': '#a78bfa', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-top">
                <div className="panel-title-wrap">
                  <Target size={20} weight="duotone" style={{ color: '#a78bfa' }} />
                  <h3>Đánh giá năng lực môn học</h3>
                </div>
              </div>
              <div className="chart-container" style={{ flex: 1, minHeight: '300px', marginTop: '16px', position: 'relative' }}>
                {!hasRadar ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Target size={48} weight="thin" style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Chưa đủ dữ liệu các môn</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                      <Radar name="Điểm TB" dataKey="Điểm_TB" stroke="#a78bfa" strokeWidth={2} fill="#a78bfa" fillOpacity={0.4} animationDuration={1500} />
                      <RechartsTooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Recent History Table */}
            <div className="bento-span-12 bento-card glow-border cascade-in" style={{ '--cascade-delay': '450ms', '--glow-color': '#fb7185', padding: '24px' }}>
              <div className="section-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <h2 className="section-heading">Lịch sử làm bài gần đây</h2>
                <Link to="/student/history" className="btn btn-ghost btn-sm">Xem tất cả</Link>
              </div>

              {recentHistory.length === 0 ? (
                <div className="empty-state" style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span className="empty-icon">📜</span>
                  <p>Bạn chưa làm bài kiểm tra nào.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bài kiểm tra</th>
                        <th>Thời gian nộp</th>
                        <th>Trạng thái</th>
                        <th>Điểm số</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentHistory.map((hist) => (
                        <tr key={hist.id}>
                          <td><strong>{hist.exam?.title || 'Bài thi đã bị xóa'}</strong></td>
                          <td>{new Date(hist.createdAt).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${hist.status === 'GRADED' ? 'badge-success' : 'badge-warning'}`}>
                              {hist.status === 'GRADED' ? 'Đã chấm' : 'Chờ chấm'}
                            </span>
                          </td>
                          <td>
                            {hist.percentage !== null ? (
                              <strong className={hist.percentage >= 50 ? 'text-success' : 'text-danger'}>
                                {Math.round(hist.percentage * 100) / 100} / 100
                              </strong>
                            ) : '-'}
                          </td>
                          <td>
                            <Link to={`/student/result/${hist.id}`} className="btn btn-primary btn-sm">Xem chi tiết</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
