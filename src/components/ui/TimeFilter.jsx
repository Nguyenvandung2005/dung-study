import React, { useState, useEffect, useRef } from 'react';
import { CalendarBlank, CaretDown } from '@phosphor-icons/react';

export default function TimeFilter({ timeRange, setTimeRange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Khởi tạo giá trị từ timeRange nếu có
  const [customStartDate, setCustomStartDate] = useState(() => timeRange.start ? timeRange.start.split('T')[0] : '');
  const [customStartTime, setCustomStartTime] = useState(() => timeRange.start && timeRange.start.includes('T') ? timeRange.start.split('T')[1].substring(0,5) : '');
  const [customEndDate, setCustomEndDate] = useState(() => timeRange.end ? timeRange.end.split('T')[0] : '');
  const [customEndTime, setCustomEndTime] = useState(() => timeRange.end && timeRange.end.includes('T') ? timeRange.end.split('T')[1].substring(0,5) : '');
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyFilter = (type, start = null, end = null) => {
    setTimeRange({ type, start, end });
    if (type !== 'custom') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!customStartDate && !customEndDate) return;
    const start = customStartDate ? `${customStartDate}T${customStartTime || '00:00'}:00.000Z` : null;
    const end = customEndDate ? `${customEndDate}T${customEndTime || '23:59'}:59.999Z` : null;
    
    // Đảm bảo start <= end nếu có cả hai
    if (start && end && new Date(start) > new Date(end)) {
      return;
    }

    setTimeRange({ type: 'custom', start, end });
  }, [customStartDate, customStartTime, customEndDate, customEndTime]);

  const getTimeRangeLabel = () => {
    switch (timeRange.type) {
      case 'today': return 'Hôm nay';
      case 'week': return 'Tuần này';
      case 'month': return 'Tháng này';
      case 'all': return 'Tất cả thời gian';
      case 'custom': return 'Tuỳ chỉnh';
      default: return 'Tất cả thời gian';
    }
  };

  return (
    <div className="time-filter-container" ref={dropdownRef} style={{ position: 'relative', zIndex: 100 }}>
      <button 
        className="btn btn-ghost" 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}
      >
        <CalendarBlank size={18} />
        <span style={{ margin: '0 8px' }}>{getTimeRangeLabel()}</span>
        <CaretDown size={14} />
      </button>

      {isOpen && (
        <div className="glass-card fade-in" style={{ position: 'absolute', right: 0, top: '100%', marginTop: '12px', padding: '16px', zIndex: 100, width: '360px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 15px 40px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', background: 'rgba(10, 15, 25, 0.95)', backdropFilter: 'blur(20px)' }}>
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
    </div>
  );
}
