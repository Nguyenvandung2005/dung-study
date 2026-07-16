import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import TimeFilter from '../components/ui/TimeFilter';
import api from '../api/client';
import ExportExamModal from '../components/exam/ExportExamModal';
import { ResponsiveContainer, ComposedChart, Line, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell, BarChart, Bar, Rectangle } from 'recharts';
import { ChartLineUp, Users, PresentationChart, ClipboardText, Target, Eye } from '@phosphor-icons/react';
import './Dashboard.css';

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const filteredPayload = payload.filter(entry => entry.name !== 'nopBai' && entry.name !== 'truyCap');
    return (
      <div className="chart-tooltip glass-card">
        <p className="tooltip-label">{label}</p>
        {filteredPayload.map((entry, index) => (
          <p key={index} className="tooltip-item" style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
  const [timeRange, setTimeRange] = useState({ type: 'all' });
  const examsRef = useRef(null);
  
  // Auto scroll if path is /teacher/exams
  useEffect(() => {
    if (window.location.pathname === '/teacher/exams' && examsRef.current) {
      setTimeout(() => {
        examsRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 500); // Wait for render
    }
  }, [loading]);

  // Filters
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [exportExam, setExportExam] = useState(null);
  const [exportingId, setExportingId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const handleOpenExportModal = async (examId) => {
    try {
      setExportingId(examId);
      const { data } = await api.get(`/exams/${examId}`);
      setExportExam(data);
    } catch (e) {
      alert('Không thể tải chi tiết đề thi để xuất');
    } finally {
      setExportingId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/statistics/teacher', { params: timeRange }),
      api.get('/exams'),
    ]).then(([statsRes, examsRes]) => {
      setStats(statsRes.data);
      setExams(examsRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));

    const handleClickOutside = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [timeRange]);

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

  const trendData = stats?.trendData || [];
  const scoreDistribution = stats?.scoreDistribution || [];
  const subjectData = stats?.subjectData || [];

  const hasTrendData = trendData.length > 0;
  const hasScoreData = scoreDistribution.some(d => d.HocSinh > 0);
  const hasSubjectData = subjectData.length > 0;

  return (
    <div className="page-layout bg-dot-grid">
      <AnimatedBackground />
      <Sidebar />

      <main className="main-content">
        <div className="admin-bento-container">
          <header className="bento-header cascade-in" style={{ '--cascade-delay': '0ms', position: 'relative', zIndex: 100 }}>
            <div>
              <h1 className="bento-title">Bảng điều khiển <span className="gradient-text">Giáo viên</span> 👩‍🏫</h1>
              <p className="bento-subtitle">Quản lý bài kiểm tra và theo dõi tiến độ của học sinh.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <TimeFilter timeRange={timeRange} setTimeRange={setTimeRange} />
              <Link to="/teacher/create" className="btn btn-primary glow-button" id="btn-create-exam">
                ➕ Tạo đề mới
              </Link>
            </div>
          </header>

          <div className="bento-grid">
            <div className="bento-span-7" style={{ display: 'flex' }}>
              <div className="bento-card theme-showcase cascade-in glow-border" style={{ '--cascade-delay': '50ms', '--glow-color': '#38bdf8', textDecoration: 'none', padding: 'var(--space-8)', flex: 1, minHeight: '300px', position: 'relative', overflow: 'hidden' }}>
                <div className="theme-showcase-bg" style={{ position: 'absolute', inset: 0, backgroundImage: "url('/teacher_bg.png')", backgroundSize: 'cover', backgroundPosition: 'center right', opacity: 0.85, zIndex: 0 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,15,25,0.98) 0%, rgba(10,15,25,0.8) 45%, rgba(10,15,25,0.1) 100%)', zIndex: 1 }}></div>
                <div className="theme-showcase-content" style={{ position: 'relative', zIndex: 2 }}>
                  <div className="theme-badge" style={{ color: '#38bdf8', borderColor: '#38bdf840' }}><PresentationChart size={16} weight="fill" /> Teacher Portal</div>
                  <h2 className="theme-title">Không gian Giảng dạy Tương lai</h2>
                  <p className="theme-desc">
                    Kiểm soát toàn diện tiến độ của học sinh, soạn giáo án điện tử và giám sát bài thi realtime.
                  </p>
                  <Link to="/teacher/exams" className="btn btn-primary theme-btn" style={{ background: '#38bdf8', color: '#0f172a' }}>
                    Quản lý ngân hàng đề
                  </Link>
                </div>
              </div>
            </div>

            <div className="bento-span-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
              {[
                { icon: ClipboardText, value: stats?.totalExams || 0, label: 'Tổng bài thi', color: '#38bdf8' },
                { icon: Eye, value: stats?.publishedExams || 0, label: 'Đang phát hành', color: '#34d399' },
                { icon: Target, value: stats?.totalSubmissions || 0, label: 'Lượt nộp bài', color: '#a78bfa' },
                { icon: PresentationChart, value: stats?.pendingGrading || 0, label: 'Chờ chấm điểm', color: '#facc15' },
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

            {/* Chart 1: Line Chart (Trend) */}
            <div className="bento-span-8 bento-card glow-border cascade-in" style={{ '--cascade-delay': '300ms', '--glow-color': '#a78bfa', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-top">
                <div className="panel-title-wrap">
                  <ChartLineUp size={20} weight="duotone" style={{ color: '#a78bfa' }} />
                  <h3>Tần suất nộp bài</h3>
                </div>
              </div>
              <div className="chart-container" style={{ flex: 1, minHeight: '260px', marginTop: '16px', position: 'relative' }}>
                {!hasTrendData ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <ChartLineUp size={48} weight="thin" style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Chưa có học sinh nộp bài</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="glowNopBaiTeacher" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                      <Area type="monotone" dataKey="nopBai" fill="url(#glowNopBaiTeacher)" stroke="none" animationDuration={1500} animationEasing="ease-out" />
                      <Line type="monotone" dataKey="nopBai" name="Nộp bài" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', stroke: '#a78bfa', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#a78bfa', stroke: 'rgba(167,139,250,0.4)', strokeWidth: 6 }} animationDuration={1500} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Subject Pie Chart */}
            <div className="bento-span-4 bento-card glow-border cascade-in" style={{ '--cascade-delay': '350ms', '--glow-color': '#38bdf8', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-top">
                <div className="panel-title-wrap">
                  <ClipboardText size={20} weight="duotone" style={{ color: '#38bdf8' }} />
                  <h3>Phân bổ bài thi</h3>
                </div>
              </div>
              <div className="chart-container" style={{ flex: 1, minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {!hasSubjectData ? (
                  <div style={{ position: 'absolute', inset: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <ClipboardText size={48} weight="thin" style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Chưa có bài thi nào</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={subjectData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Score Distribution Bar Chart */}
            <div className="bento-span-12 bento-card glow-border cascade-in" style={{ '--cascade-delay': '400ms', '--glow-color': '#fb7185', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-top">
                <div className="panel-title-wrap">
                  <Target size={20} weight="duotone" style={{ color: '#fb7185' }} />
                  <h3>Phổ điểm học sinh</h3>
                </div>
              </div>
              <div className="chart-container" style={{ flex: 1, minHeight: '260px', marginTop: '16px', position: 'relative' }}>
                {!hasScoreData ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Target size={48} weight="thin" style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Chưa có điểm số nào</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Bar dataKey="HocSinh" name="Số học sinh" fill="#fb7185" radius={[4, 4, 0, 0]} activeBar={<Rectangle fill="#f43f5e" stroke="#fb7185" />} animationDuration={1500} animationEasing="ease-out" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Exam Table list */}
            <div ref={examsRef} className="bento-span-12 bento-card glow-border cascade-in" style={{ '--cascade-delay': '450ms', '--glow-color': '#34d399', padding: '24px' }}>
              <div className="section-header" style={{ marginBottom: '16px' }}>
                <h2 className="section-heading">Quản lý bài kiểm tra</h2>
              </div>

              {exams.length > 0 && (
                <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <select className="input" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ width: '180px', background: 'rgba(0,0,0,0.3)' }}>
                    <option value="">Tất cả môn học</option>
                    {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  <select className="input" value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={{ width: '150px', background: 'rgba(0,0,0,0.3)' }}>
                    <option value="">Tất cả khối</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                      <option key={g} value={String(g)}>Khối {g}</option>
                    ))}
                  </select>
                  <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '180px', background: 'rgba(0,0,0,0.3)' }}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="published">Đã phát hành</option>
                    <option value="draft">Chưa phát hành</option>
                  </select>
                </div>
              )}

              {filteredExams.length === 0 ? (
                <div className="empty-state" style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span className="empty-icon">📝</span>
                  <p>Không tìm thấy bài kiểm tra nào phù hợp.</p>
                  {exams.length === 0 && <Link to="/teacher/create" className="btn btn-primary btn-sm">Tạo ngay</Link>}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
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
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '6px 8px', borderRadius: '8px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === exam.id ? null : exam.id);
                                }}
                                title="Hành động"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="3" y1="12" x2="21" y2="12"></line>
                                  <line x1="3" y1="6" x2="21" y2="6"></line>
                                  <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                              </button>

                              {openDropdownId === exam.id && (
                                <div
                                  className="glass-card fade-in"
                                  style={{
                                    position: 'absolute',
                                    right: '0',
                                    top: '100%',
                                    marginTop: '8px',
                                    padding: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    zIndex: 50,
                                    minWidth: '160px',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm dropdown-action-item action-share"
                                    onClick={() => {
                                      const link = `${window.location.origin}/student/exam/${exam.id}`;
                                      navigator.clipboard.writeText(link).then(() => {
                                        alert('Đã copy link bài thi: ' + link);
                                        setOpenDropdownId(null);
                                      });
                                    }}
                                  >
                                    🔗 Chia sẻ
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm dropdown-action-item action-export"
                                    disabled={exportingId === exam.id}
                                    onClick={() => {
                                      handleOpenExportModal(exam.id);
                                      setOpenDropdownId(null);
                                    }}
                                  >
                                    {exportingId === exam.id ? '⌛ Đang tải...' : '📥 Xuất đề'}
                                  </button>
                                  <Link
                                    to={`/teacher/statistics/${exam.id}`}
                                    className="btn btn-ghost btn-sm dropdown-action-item action-stats"
                                  >
                                    📊 Thống kê
                                  </Link>
                                  <Link
                                    to={`/teacher/edit/${exam.id}`}
                                    className="btn btn-ghost btn-sm dropdown-action-item action-edit"
                                  >
                                    ✏️ Sửa
                                  </Link>
                                </div>
                              )}
                            </div>
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

      <ExportExamModal
        isOpen={!!exportExam}
        exam={exportExam}
        onClose={() => setExportExam(null)}
      />
    </div>
  );
}
