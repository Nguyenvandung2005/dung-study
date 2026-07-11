import React, { useState } from 'react';

export default function SecurityLogModal({ log, onClose }) {
  const [showRawUa, setShowRawUa] = useState(false);

  if (!log) return null;

  // Parse User Agent into friendly readable names
  const parseUserAgent = (ua) => {
    if (!ua) return { browser: 'Không xác định', os: 'Không xác định', device: 'Thiết bị không xác định' };
    
    let browser = 'Trình duyệt khác';
    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Google Chrome';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';
    else if (ua.includes('PostmanRuntime')) browser = 'Postman API Client';
    else if (ua.includes('curl')) browser = 'cURL Tool';

    let os = 'Hệ điều hành khác';
    if (ua.includes('Windows NT 10.0')) os = 'Windows 10 / 11';
    else if (ua.includes('Windows')) os = 'Windows PC';
    else if (ua.includes('Mac OS X')) os = 'Apple macOS';
    else if (ua.includes('Android')) os = 'Android OS';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'Apple iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    let device = 'máy tính để bàn / laptop';
    if (ua.includes('Mobi') || ua.includes('Android') || ua.includes('iPhone')) {
      device = 'thiết bị di động (Mobile/Tablet)';
    }

    return { browser, os, device };
  };

  // Friendly action explanation
  const getActionExplanation = (action) => {
    const map = {
      LOGIN_SUCCESS: 'Đăng nhập thành công vào hệ thống',
      LOGIN_FAIL: 'Đăng nhập thất bại (sai mật khẩu hoặc tài khoản không đúng)',
      REGISTER: 'Đăng ký tài khoản mới thành công',
      BRUTE_FORCE_DETECTED: 'Cảnh báo dò quét mật khẩu / gửi yêu cầu liên tục bất thường',
      BLOCKED_REQUEST: 'Yêu cầu truy cập bị hệ thống từ chối do IP đang trong danh sách chặn',
      LOGOUT: 'Đăng xuất khỏi hệ thống'
    };
    return map[action] || action;
  };

  const uaInfo = parseUserAgent(log.userAgent);
  const isLocalIp = log.ip === '::1' || log.ip === '127.0.0.1' || log.ip?.startsWith('192.168.') || log.ip?.startsWith('10.');

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 22, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          background: 'var(--bg-card)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--clr-primary-400)', fontWeight: 600 }}>
              CHI TIẾT NHẬT KÝ BẢO MẬT
            </span>
            <h3 style={{ fontSize: '1.4rem', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="gradient-text">{log.action}</span>
              <span className={`badge ${log.severity === 'CRITICAL' || log.severity === 'HIGH' ? 'badge-danger' : log.severity === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                {log.severity}
              </span>
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#fff',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Section 1: Where are they? */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--clr-primary-400)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📍 Họ đang ở đâu & Dùng thiết bị gì? (Vị trí & Thiết bị)
          </h4>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ĐỊA CHỈ IP TRUY CẬP</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{log.ip}</span>
                  {isLocalIp ? (
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>Nội bộ / Localhost</span>
                  ) : (
                    <a 
                      href={`https://ipinfo.io/${log.ip}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="badge badge-primary"
                      style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                    >
                      🗺️ Tra cứu bản đồ IP
                    </a>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>THỜI GIAN THỰC HIỆN</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '4px' }}>
                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>MÔI TRƯỜNG / HỆ ĐIỀU HÀNH & TRÌNH DUYỆT</div>
              <div style={{ fontSize: '1rem', fontWeight: 500, marginTop: '4px', color: 'var(--text-primary)' }}>
                🖥️ <strong>{uaInfo.browser}</strong> đang chạy trên <strong>{uaInfo.os}</strong> ({uaInfo.device})
              </div>
              <div style={{ marginTop: '8px' }}>
                <button 
                  onClick={() => setShowRawUa(!showRawUa)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--clr-primary-400)', 
                    cursor: 'pointer', 
                    fontSize: '0.8rem', 
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  {showRawUa ? 'Ẩn chuỗi User-Agent gốc' : 'Xem chuỗi User-Agent gốc'}
                </button>
                {showRawUa && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px 12px', 
                    background: 'rgba(0,0,0,0.4)', 
                    borderRadius: '8px', 
                    fontSize: '0.78rem', 
                    fontFamily: 'monospace', 
                    wordBreak: 'break-all',
                    color: 'var(--text-secondary)'
                  }}>
                    {log.userAgent || 'Không có thông tin User Agent'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Who are they? */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--clr-primary-400)', marginBottom: '12px' }}>
            👤 Họ là ai? (Tài khoản tác động)
          </h4>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {log.user ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{log.user.name}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '2px' }}>Email: {log.user.email}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="badge badge-primary">
                    {log.user.role === 'ADMIN' ? 'Quản trị viên' : log.user.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                  </span>
                  {log.user.grade && <span className="badge badge-secondary">Lớp {log.user.grade}</span>}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>
                Khách truy cập ẩn danh (chưa đăng nhập vào hệ thống hoặc thao tác trước khi đăng nhập).
              </div>
            )}
          </div>
        </div>

        {/* Section 3: What did they do? */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--clr-primary-400)', marginBottom: '12px' }}>
            ⚡ Đã làm gì trong hệ thống? (Chi tiết hành động)
          </h4>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {getActionExplanation(log.action)}
            </p>

            {/* Extra details payload */}
            {log.details && Object.keys(log.details).length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>THÔNG SỐ / DỮ LIỆU BỔ SUNG GHI NHẬN:</div>
                <pre style={{
                  background: 'rgba(0,0,0,0.35)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  overflowX: 'auto',
                  margin: 0,
                  color: 'var(--clr-emerald-400)'
                }}>
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Đóng chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}
