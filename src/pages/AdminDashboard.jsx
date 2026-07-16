import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ClipboardText,
  PaperPlaneTilt,
  ShieldWarning,
  Palette,
  Lock,
  ArrowRight,
  Globe,
  UserCircle,
  Pulse,
  CaretRight,
  ShieldCheck,
  ChartLineUp
} from '@phosphor-icons/react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Sidebar from '../components/ui/Sidebar';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import api from '../api/client';
import './AdminDashboard.css';

/* ---- ANIMATED COUNTER ---- */
function AnimatedCounter({ value, duration = 1500 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const finalValue = parseInt(value) || 0;
    if (finalValue === 0) {
      setCount(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * finalValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <>{count}</>;
}

/* ---- COMPONENTS ---- */
function SkeletonPulse({ style, className = '' }) {
  return <div className={`skeleton-pulse ${className}`} style={style} />;
}

function StatCard({ icon: Icon, value, label, accentColor, delay = 0, to, trend = '+12%' }) {
  return (
    <Link
      to={to}
      className="bento-card stat-card cascade-in glow-border"
      style={{ '--accent': accentColor, '--cascade-delay': `${delay}ms`, '--glow-color': accentColor, textDecoration: 'none', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      <div className="stat-card-bg-layer" style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none' }}>
        <div className="stat-card-glow" style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 100% 100%, ${accentColor}15 0%, transparent 60%)` }} />
        <Icon className="stat-watermark" size={140} weight="fill" style={{ position: 'absolute', bottom: '-20px', right: '-20px', color: accentColor, opacity: 0.05, transform: 'rotate(-15deg)' }} />
      </div>

      <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        <div className="bento-icon-wrap" style={{ color: accentColor, background: `${accentColor}1A`, padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={26} weight="duotone" />
        </div>
        {trend && (
          <div className="stat-trend" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
            <ChartLineUp size={14} weight="bold" />
            {trend}
          </div>
        )}
      </div>

      <div className="bento-stat-content" style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: '20px' }}>
        <span className="bento-stat-val" style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1, background: `linear-gradient(135deg, #ffffff 0%, ${accentColor} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <AnimatedCounter value={value} />
        </span>
        <span className="bento-stat-label" style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '500', marginTop: '8px' }}>
          {label}
        </span>
      </div>
    </Link>
  );
}

function LogEntry({ log, index }) {
  const severityMap = {
    CRITICAL: { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', label: 'CRIT' },
    HIGH: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'HIGH' },
    MEDIUM: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'MED' },
    LOW: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'LOW' },
  };
  const sev = severityMap[log.severity] || severityMap.LOW;

  return (
    <div
      className="terminal-log-entry cascade-in"
      style={{ '--cascade-delay': `${300 + index * 50}ms`, borderLeftColor: sev.color, background: sev.bg }}
    >
      <span className="term-badge" style={{ color: sev.color, borderColor: `${sev.color}40` }}>{sev.label}</span>
      <span className="term-action">{log.action}</span>
      <span className="term-time">{new Date(log.createdAt).toLocaleTimeString('en-US', { hour12: false })}</span>
      <span className="term-ip"><Globe size={14} /> {log.ip}</span>
      <span className="term-user"><UserCircle size={14} /> {log.user?.name || 'GUEST'}</span>
    </div>
  );
}

/* Custom Tooltip for Recharts */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Lọc bỏ những mục của thẻ Area (không có name custom)
    const filteredPayload = payload.filter(entry => entry.name !== 'truyCap' && entry.name !== 'nopBai');

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

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState({ type: 'all' });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');

  const handleApplyFilter = (type, start = null, end = null) => {
    setTimeRange({ type, start, end });
    if (type !== 'custom') {
      setIsDatePickerOpen(false);
    }
  };

  useEffect(() => {
    if (!customStartDate && !customEndDate) return;
    const start = customStartDate ? `${customStartDate}T${customStartTime || '00:00'}:00.000Z` : null;
    const end = customEndDate ? `${customEndDate}T${customEndTime || '23:59'}:59.999Z` : null;
    setTimeRange({ type: 'custom', start, end });
  }, [customStartDate, customStartTime, customEndDate, customEndTime]);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/dashboard', { params: timeRange })
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [timeRange]);

  const stats = [
    { icon: Users, value: data?.totalUsers || 0, label: 'Người dùng', accentColor: '#38bdf8', to: '/admin/users' },
    { icon: ClipboardText, value: data?.totalExams || 0, label: 'Bài kiểm tra', accentColor: '#34d399', to: '/admin/exams' },
    { icon: PaperPlaneTilt, value: data?.totalSubmissions || 0, label: 'Lượt nộp bài', accentColor: '#a78bfa', to: '/admin/exams' },
    { icon: ShieldWarning, value: data?.criticalLogs || 0, label: 'Cảnh báo 24h', accentColor: '#fb7185', to: '/admin/security' },
  ];

  // Process data for Donut Chart
  const roleColors = { 'STUDENT': '#38bdf8', 'TEACHER': '#a78bfa', 'ADMIN': '#fb7185' };
  const roleData = data?.usersByRole?.map(item => ({
    name: item.role === 'STUDENT' ? 'Học sinh' : item.role === 'TEACHER' ? 'Giáo viên' : 'Admin',
    value: item._count,
    color: roleColors[item.role] || '#888'
  })) || [];

  // Dynamic Line Chart Data
  const activityData = data?.activityData || [];
  const hasActivityData = activityData.length > 0;
  const hasRoleData = roleData.length > 0;

  const getTimeRangeLabel = () => {
    switch (timeRange.type) {
      case 'today': return 'Hôm nay';
      case 'week': return 'Tuần này';
      case 'month': return 'Tháng này';
      case 'all': return 'Tất cả thời gian';
      case 'custom': return 'Tuỳ chỉnh';
      default: return '';
    }
  };

  return (
    <div className="page-layout bg-dot-grid">
      <AnimatedBackground />
      <Sidebar />

      <main className="main-content">
        <div className="admin-bento-container">

          <header className="bento-header cascade-in" style={{ '--cascade-delay': '0ms', position: 'relative', zIndex: 100 }}>
            <div>
              <h1 className="bento-title">Tổng quan Hệ thống</h1>
              <p className="bento-subtitle">Giám sát bảo mật, lưu lượng truy cập và điều khiển giao diện.</p>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', position: 'relative' }}>
              <button 
                className="btn btn-ghost"
                style={{ padding: '8px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              >
                {timeRange.type === 'today' ? 'Hôm nay' : 
                 timeRange.type === 'week' ? 'Tuần này' : 
                 timeRange.type === 'month' ? 'Tháng này' : 
                 timeRange.type === 'custom' ? 'Tuỳ chỉnh' : 'Tất cả thời gian'} ▾
              </button>

              {isDatePickerOpen && (
                <div className="glass-card fade-in" style={{ position: 'absolute', right: '180px', top: '100%', marginTop: '12px', padding: '16px', zIndex: 100, width: '360px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 15px 40px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', background: 'rgba(10, 15, 25, 0.95)', backdropFilter: 'blur(20px)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleApplyFilter('today')} style={{ background: 'rgba(255,255,255,0.05)' }}>Hôm nay</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleApplyFilter('week')} style={{ background: 'rgba(255,255,255,0.05)' }}>Tuần này</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleApplyFilter('month')} style={{ background: 'rgba(255,255,255,0.05)' }}>Tháng này</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleApplyFilter('all')} style={{ background: 'rgba(255,255,255,0.05)' }}>Tất cả</button>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Từ thời điểm:</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="date" className="input" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} style={{ flex: 2, background: 'rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
                        <input type="time" className="input" value={customStartTime} onChange={e => setCustomStartTime(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Đến thời điểm:</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="date" className="input" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} style={{ flex: 2, background: 'rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
                        <input type="time" className="input" value={customEndTime} onChange={e => setCustomEndTime(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', colorScheme: 'dark' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="system-health-chip">
                <Pulse size={18} weight="bold" className="health-icon" />
                <span>Hệ thống ổn định</span>
                <span className="health-dot" />
              </div>
            </div>
          </header>

          <div className="bento-grid">

            {/* Top row: Theme Showcase (Span 7) + 4 Stat Cards in 2x2 grid (Span 5) */}
            <div className="bento-span-7" style={{ display: 'flex' }}>
              <Link to="/admin/animation" className="bento-card theme-showcase cascade-in glow-border" style={{ '--cascade-delay': '50ms', '--glow-color': '#f59e0b', textDecoration: 'none', padding: 'var(--space-8)', flex: 1, minHeight: '300px' }}>
                <div className="theme-showcase-bg"></div>
                <div className="theme-showcase-content">
                  <div className="theme-badge"><Palette size={16} weight="fill" /> Visual Engine</div>
                  <h2 className="theme-title">Kiến trúc Giao diện Động</h2>
                  <p className="theme-desc">
                    Kiểm soát 36+ tổ hợp giao diện với 6 hạt nhân màu sắc và 5 động cơ hiệu ứng.
                    Thiết kế được tối ưu hóa hiển thị trên màn hình Retina.
                  </p>
                  <div className="btn btn-primary theme-btn">
                    Truy cập phòng điều khiển <ArrowRight size={16} weight="bold" />
                  </div>
                </div>
              </Link>
            </div>

            <div className="bento-span-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bento-card skeleton-card">
                    <SkeletonPulse style={{ width: '100%', height: '100%', minHeight: '130px' }} />
                  </div>
                ))
              ) : (
                stats.map((s, i) => (
                  <StatCard key={s.label} {...s} delay={100 + i * 50} />
                ))
              )}
            </div>

            {/* Middle Row: Line Chart (Span 8) + Donut Chart (Span 4) */}
            <div className="bento-card bento-span-8 chart-panel cascade-in glow-border" style={{ '--cascade-delay': '250ms', '--glow-color': '#38bdf8', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-top">
                <div className="panel-title-wrap">
                  <ChartLineUp size={20} weight="duotone" style={{ color: '#38bdf8' }} />
                  <h3>Lưu lượng hoạt động ({getTimeRangeLabel()})</h3>
                </div>
              </div>
              <div className="chart-container" style={{ flex: 1, minHeight: '260px', marginTop: '16px', position: 'relative' }}>
                {!hasActivityData ? (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <ChartLineUp size={48} weight="thin" style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Chưa có hoạt động nào trong khoảng thời gian này</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={activityData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <marker id="arrowBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                        </marker>
                        <marker id="arrowPurple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a78bfa" />
                        </marker>
                        <linearGradient id="glowTruyCap" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="glowNopBai" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />

                      {/* Glowing Areas */}
                      <Area type="linear" dataKey="truyCap" fill="url(#glowTruyCap)" stroke="none" animationDuration={1500} animationEasing="ease-out" />
                      <Area type="linear" dataKey="nopBai" fill="url(#glowNopBai)" stroke="none" animationDuration={1500} animationEasing="ease-out" />

                      {/* Crisp Lines with Arrows */}
                      <Line type="linear" dataKey="truyCap" name="Truy cập" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, fill: '#0f172a', stroke: '#38bdf8', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#38bdf8', stroke: 'rgba(56,189,248,0.4)', strokeWidth: 6 }} style={{ strokeLinecap: 'round' }} markerEnd="url(#arrowBlue)" animationDuration={1500} animationEasing="ease-out" />
                      <Line type="linear" dataKey="nopBai" name="Nộp bài" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 4, fill: '#0f172a', stroke: '#a78bfa', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#a78bfa', stroke: 'rgba(167,139,250,0.4)', strokeWidth: 6 }} style={{ strokeLinecap: 'round' }} markerEnd="url(#arrowPurple)" animationDuration={1500} animationEasing="ease-out" />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bento-card bento-span-4 chart-panel cascade-in glow-border" style={{ '--cascade-delay': '300ms', '--glow-color': '#a78bfa', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-top">
                <div className="panel-title-wrap">
                  <Users size={20} weight="duotone" style={{ color: '#a78bfa' }} />
                  <h3>Phân bổ người dùng</h3>
                </div>
              </div>
              <div className="chart-container" style={{ flex: 1, minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {!hasRoleData ? (
                  <div style={{ position: 'absolute', inset: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Users size={48} weight="thin" style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Không có người dùng mới</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {roleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Custom Legend */}
              <div className="custom-legend">
                {roleData.map(entry => (
                  <div key={entry.name} className="legend-item">
                    <span className="legend-dot" style={{ background: entry.color }} />
                    <span className="legend-name">{entry.name}</span>
                    <span className="legend-value">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom row: Security Summary (Span 12) or another layout */}
            {/* We moved Theme showcase up, so we can make Security Panel span-12 or span-8 empty, etc. Let's make it span-12 for better log viewing */}
            <div className="bento-card bento-span-12 security-panel cascade-in glow-border" style={{ '--cascade-delay': '400ms', '--glow-color': '#fb7185', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-top">
                <div className="panel-title-wrap">
                  <Lock size={20} weight="duotone" style={{ color: '#fb7185' }} />
                  <h3>Telemetry Bảo mật</h3>
                </div>
                <Link to="/admin/security" className="view-all-link">
                  Chi tiết <CaretRight size={14} weight="bold" />
                </Link>
              </div>

              <div className="terminal-logs-container">
                {loading ? (
                  Array(5).fill(0).map((_, i) => <SkeletonPulse key={i} style={{ height: 48, borderRadius: 6, marginBottom: 8 }} />)
                ) : data?.recentLogs?.length === 0 ? (
                  <div className="empty-terminal">
                    <ShieldCheck size={32} weight="thin" />
                    <span>Hệ thống an toàn. Không có sự kiện.</span>
                  </div>
                ) : (
                  data?.recentLogs?.map((log, i) => <LogEntry key={log.id} log={log} index={i} />)
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
