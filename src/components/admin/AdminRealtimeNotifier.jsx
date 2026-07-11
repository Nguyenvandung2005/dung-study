import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function AdminRealtimeNotifier() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeToasts, setActiveToasts] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenEventIds = useRef(new Set());

  // Subtle web audio chime sound
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  const handleNewEvent = (event) => {
    if (!event || !event.id) return;
    if (seenEventIds.current.has(event.id)) return;
    seenEventIds.current.add(event.id);

    // Play chime sound
    playNotificationSound();

    // Add to toast popup list
    setActiveToasts(prev => [event, ...prev].slice(0, 4)); // max 4 toasts simultaneously
    setHistoryEvents(prev => [event, ...prev].slice(0, 30));
    setUnreadCount(prev => prev + 1);

    // Auto dismiss toast after 14 seconds
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== event.id));
    }, 14000);
  };

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    // Fetch initial recent events
    api.get('/admin/recent-events')
      .then(res => {
        const events = res.data?.events || [];
        events.forEach(e => {
          if (e.id) seenEventIds.current.add(e.id);
        });
        setHistoryEvents(events);
      })
      .catch(() => {});

    // Setup polling fallback every 3 seconds to catch new events & keep drawer updated
    const pollInterval = setInterval(() => {
      api.get('/admin/recent-events')
        .then(res => {
          const events = res.data?.events || [];
          setHistoryEvents(events);
          events.forEach(e => {
            if (e.id && !seenEventIds.current.has(e.id)) {
              handleNewEvent(e);
            }
          });
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [user]);

  if (!user || user.role !== 'ADMIN') return null;

  // Handle Action Suggestion Click
  const executeActionSuggestion = async (event, suggestion) => {
    if (!suggestion) return;

    if (suggestion.actionType === 'NAVIGATE' || suggestion.actionType === 'VIEW_LOG') {
      navigate(suggestion.target || '/admin/security');
      setActiveToasts(prev => prev.filter(t => t.id !== event.id));
      setShowDrawer(false);
    } else if (suggestion.actionType === 'BLOCK_IP') {
      try {
        await api.post('/admin/block-ip', { ip: suggestion.target, durationMinutes: 30 });
        alert(`✅ Đã khóa thành công IP ${suggestion.target} trong vòng 30 phút!`);
        setActiveToasts(prev => prev.map(t => t.id === event.id ? {
          ...t,
          actionSuggestion: { ...suggestion, label: '✅ Đã khóa IP 30 phút', completed: true }
        } : t));
      } catch (err) {
        alert('Lỗi khi chặn IP: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const getEventIcon = (type, severity) => {
    if (severity === 'CRITICAL' || type === 'SECURITY_THREAT') return '🚨';
    if (type === 'EXAM_SUBMITTED') return '✍️';
    if (type === 'EXAM_CREATED') return '📝';
    if (type === 'USER_REGISTER') return '🎉';
    if (type === 'USER_LOGIN') return '🔑';
    return '🔔';
  };

  return (
    <>
      {/* Floating Bell Button for Admin (Bottom Right) */}
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9998
        }}
      >
        <button
          onClick={() => { setShowDrawer(!showDrawer); setUnreadCount(0); }}
          style={{
            background: 'linear-gradient(135deg, var(--clr-primary-600), var(--clr-indigo-600))',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '54px',
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
            position: 'relative',
            transition: 'transform 0.2s'
          }}
          title="Hoạt động thời gian thực (Admin Realtime Notification Hub)"
        >
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--clr-rose-500)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              borderRadius: '12px',
              padding: '2px 7px',
              border: '2px solid #080818'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Floating Real-time Toast Notifications (Bottom Right stacked above button) */}
      <div 
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: '12px',
          maxWidth: '390px',
          width: 'calc(100vw - 48px)'
        }}
      >
        {activeToasts.map((toast) => (
          <div
            key={toast.id}
            className="glass-card"
            style={{
              padding: '16px 18px',
              borderRadius: '14px',
              background: toast.severity === 'CRITICAL' 
                ? 'linear-gradient(135deg, rgba(225, 29, 72, 0.2), rgba(15, 23, 42, 0.95))'
                : 'rgba(15, 23, 42, 0.95)',
              border: toast.severity === 'CRITICAL'
                ? '1px solid rgba(244, 63, 94, 0.5)'
                : '1px solid rgba(129, 140, 248, 0.3)',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>
                <span style={{ fontSize: '1.2rem' }}>{getEventIcon(toast.type, toast.severity)}</span>
                <span>{toast.title}</span>
              </div>
              <button
                onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: '0 4px'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '6px 0 12px 0', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {toast.message}
            </p>

            {/* Smart Action Suggestion Button */}
            {toast.actionSuggestion && (
              <div style={{ marginTop: '10px' }}>
                <button
                  disabled={toast.actionSuggestion.completed}
                  onClick={() => executeActionSuggestion(toast, toast.actionSuggestion)}
                  className={toast.actionSuggestion.actionType === 'BLOCK_IP' ? 'btn btn-danger' : 'btn btn-primary'}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: toast.actionSuggestion.completed ? 'default' : 'pointer',
                    opacity: toast.actionSuggestion.completed ? 0.75 : 1
                  }}
                >
                  {toast.actionSuggestion.label}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Real-time History Drawer */}
      {showDrawer && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setShowDrawer(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '420px',
              height: '100%',
              background: '#0a0e23',
              borderLeft: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>🔔 Nhật ký Hoạt động (Real-time)</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Cập nhật liên tục thao tác người dùng và gợi ý thông minh
                </p>
              </div>
              <button 
                onClick={() => setShowDrawer(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {historyEvents.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                  Chưa có hoạt động nào được ghi nhận.
                </p>
              ) : (
                historyEvents.map((ev) => (
                  <div 
                    key={ev.id} 
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>
                        {getEventIcon(ev.type, ev.severity)} {ev.title}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(ev.timestamp).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    <p style={{ margin: '6px 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      {ev.message}
                    </p>
                    {ev.actionSuggestion && (
                      <button
                        disabled={ev.actionSuggestion.completed}
                        onClick={() => executeActionSuggestion(ev, ev.actionSuggestion)}
                        className={ev.actionSuggestion.actionType === 'BLOCK_IP' ? 'btn btn-danger' : 'btn btn-outline'}
                        style={{
                          width: '100%',
                          marginTop: '8px',
                          padding: '6px 12px',
                          fontSize: '0.8rem'
                        }}
                      >
                        {ev.actionSuggestion.label}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
