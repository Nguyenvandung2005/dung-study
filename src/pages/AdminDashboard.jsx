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
      <div className="terminal-log-header">
        <span className="term-badge" style={{ color: sev.color, borderColor: `${sev.color}40` }}>{sev.label}</span>
        <span className="term-action">{log.action}</span>
        <span className="term-time">{new Date(log.createdAt).toLocaleTimeString('en-US', { hour12: false })}</span>
      </div>
      <div className="terminal-log-footer">
        <span className="term-ip"><Globe size={12} /> {log.ip}</span>
        <span className="term-user"><UserCircle size={12} /> {log.user?.name || 'GUEST'}</span>
      </div>
    </div>
  );
}

/* Custom Tooltip for Recharts */
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

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  // Mock Line Chart Data (Last 7 days activity)
  const activityData = [
    { name: 'T2', truyCap: 120, nopBai: 30 },
    { name: 'T3', truyCap: 180, nopBai: 45 },
    { name: 'T4', truyCap: 250, nopBai: 80 },
    { name: 'T5', truyCap: 210, nopBai: 60 },
    { name: 'T6', truyCap: 300, nopBai: 120 },
    { name: 'T7', truyCap: 350, nopBai: 150 },
    { name: 'CN', truyCap: 280, nopBai: 90 },
  ];

  return (
    <div className="page-layout bg-dot-grid">
      <AnimatedBackground />
      <Sidebar />

      <main className="main-content">
        <div className="admin-bento-container">

          <header className="bento-header cascade-in" style={{ '--cascade-delay': '0ms' }}>
            <div>
              <h1 className="bento-title">Tổng quan Hệ thống</h1>
              <p className="bento-subtitle">Giám sát bảo mật, lưu lượng truy cập và điều khiển giao diện.</p>
            </div>
            <div className="system-health-chip">
              <Pulse size={18} weight="bold" className="health-icon" />
              <span>Hệ thống ổn định</span>
              <span className="health-dot" />
            </div>
          </header>

          <div className="bento-grid">

            {/* Top row: 4 Stat Cards */}
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bento-card bento-span-3 skeleton-card">
                  <SkeletonPulse style={{ width: '100%', height: '100%' }} />
                </div>
              ))
            ) : (
              stats.map((s, i) => (
                <div key={s.label} className="bento-span-3">
                  <StatCard {...s} delay={50 + i * 50} />
                </div>
              ))
            )}

            {/* Middle Row: Line Chart (Span 8) + Donut Chart (Span 4) */}
            <div className="bento-card bento-span-8 chart-panel cascade-in glow-border" style={{ '--cascade-delay': '250ms', '--glow-color': '#38bdf8', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-top">
                <div className="panel-title-wrap">
                  <ChartLineUp size={20} weight="duotone" style={{ color: '#38bdf8' }} />
                  <h3>Lưu lượng hoạt động (7 ngày qua)</h3>
                </div>
              </div>
              <div className="chart-container" style={{ flex: 1, minHeight: '260px', marginTop: '16px' }}>
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
              </div>
            </div>

            <div className="bento-card bento-span-4 chart-panel cascade-in glow-border" style={{ '--cascade-delay': '300ms', '--glow-color': '#a78bfa', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-top">
                <div className="panel-title-wrap">
                  <Users size={20} weight="duotone" style={{ color: '#a78bfa' }} />
                  <h3>Phân bổ người dùng</h3>
                </div>
              </div>
              <div className="chart-container" style={{ flex: 1, minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

            {/* Bottom row: Theme Showcase (Span 7) + Security Summary (Span 5) */}
            <Link to="/admin/animation" className="bento-card bento-span-7 theme-showcase cascade-in glow-border" style={{ '--cascade-delay': '350ms', '--glow-color': '#f59e0b', textDecoration: 'none', padding: 'var(--space-8)' }}>
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

            <div className="bento-card bento-span-5 security-panel cascade-in glow-border" style={{ '--cascade-delay': '400ms', '--glow-color': '#fb7185', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column' }}>
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
