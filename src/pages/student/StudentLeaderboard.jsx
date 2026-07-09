import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import api from '../../api/client';
import '../Dashboard.css';

const MEDAL = ['🥇', '🥈', '🥉'];
const RANK_COLORS = {
  1: { bg: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))', border: 'rgba(251,191,36,0.5)', text: '#fbbf24' },
  2: { bg: 'linear-gradient(135deg, rgba(156,163,175,0.2), rgba(107,114,128,0.1))', border: 'rgba(156,163,175,0.5)', text: '#9ca3af' },
  3: { bg: 'linear-gradient(135deg, rgba(180,120,60,0.2), rgba(146,92,45,0.1))', border: 'rgba(180,120,60,0.5)', text: '#cd7f32' },
};

function getScoreColor(score) {
  if (score >= 80) return '#34d399';
  if (score >= 50) return '#fbbf24';
  return '#fb7185';
}

function getPerformanceLabel(score) {
  if (score >= 90) return { label: 'Xuất sắc', color: '#34d399' };
  if (score >= 80) return { label: 'Giỏi', color: '#60a5fa' };
  if (score >= 65) return { label: 'Khá', color: '#fbbf24' };
  if (score >= 50) return { label: 'Trung bình', color: '#fb923c' };
  return { label: 'Yếu', color: '#fb7185' };
}

export default function StudentLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    api.get('/statistics/leaderboard?limit=20')
      .then(res => {
        const data = res.data.leaderboard || [];
        setLeaderboard(data);
        const me = data.find(e => e.userId === user?.id);
        if (me) setMyRank(me);
      })
      .catch(err => setError(err.response?.data?.message || 'Lỗi tải bảng xếp hạng'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">🏆 Bảng <span className="gradient-text">Xếp hạng</span></h1>
            <p className="page-subtitle">Top học sinh xuất sắc nhất toàn hệ thống</p>
          </div>
        </div>

        {/* My rank card */}
        {myRank && (
          <div className="glass-card fade-in" style={{
            padding: 'var(--space-5) var(--space-6)',
            marginBottom: 'var(--space-6)',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))',
            border: '1px solid rgba(139,92,246,0.4)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
          }}>
            <div style={{ fontSize: '2.5rem' }}>{myRank.rank <= 3 ? MEDAL[myRank.rank - 1] : `#${myRank.rank}`}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Vị trí của bạn: <span className="gradient-text">Hạng {myRank.rank}</span></p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Điểm TB: <strong style={{ color: getScoreColor(myRank.avgScore) }}>{myRank.avgScore}%</strong> •
                Đã làm: <strong>{myRank.examCount} bài</strong>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {(() => {
                const perf = getPerformanceLabel(myRank.avgScore);
                return (
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${perf.color}`, color: perf.color }}>
                    {perf.label}
                  </span>
                );
              })()}
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 40, height: 40 }} />
            <p>Đang tải bảng xếp hạng...</p>
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--clr-rose-500)' }}>❌ {error}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state glass-card">
            <span className="empty-icon">🏆</span>
            <p>Chưa có dữ liệu xếp hạng. Hãy hoàn thành bài thi đầu tiên!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {leaderboard.map((entry) => {
              const rankStyle = RANK_COLORS[entry.rank] || {};
              const isMe = entry.userId === user?.id;
              const perf = getPerformanceLabel(entry.avgScore);

              return (
                <div key={entry.userId} className="glass-card" style={{
                  padding: 'var(--space-4) var(--space-6)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  background: isMe
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))'
                    : (rankStyle.bg || 'transparent'),
                  border: isMe
                    ? '1px solid rgba(139,92,246,0.5)'
                    : `1px solid ${rankStyle.border || 'var(--border-subtle)'}`,
                  transition: 'transform 0.2s ease',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}
                >
                  {/* Rank */}
                  <div style={{ minWidth: 48, textAlign: 'center' }}>
                    {entry.rank <= 3 ? (
                      <span style={{ fontSize: '2rem' }}>{MEDAL[entry.rank - 1]}</span>
                    ) : (
                      <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-muted)' }}>#{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${rankStyle.text || 'var(--clr-primary-400)'}, rgba(0,0,0,0.3))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1.1rem', color: '#fff',
                    border: `2px solid ${rankStyle.border || 'var(--border-subtle)'}`,
                  }}>
                    {entry.name?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: isMe ? '#c084fc' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {entry.name}
                      {isMe && <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.2)', color: '#c084fc', padding: '2px 8px', borderRadius: 999 }}>Bạn</span>}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Lớp {entry.grade} • {entry.examCount} bài thi
                    </p>
                  </div>

                  {/* Score + Label */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: getScoreColor(entry.avgScore) }}>
                      {entry.avgScore}%
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: perf.color }}>
                      {perf.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
