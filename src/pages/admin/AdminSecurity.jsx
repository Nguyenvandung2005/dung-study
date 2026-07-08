import { useEffect, useState } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import api from '../../api/client';

export default function AdminSecurity() {
  const [logs, setLogs] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/security-logs'),
      api.get('/admin/anomalies')
    ]).then(([logsRes, anomaliesRes]) => {
      setLogs(logsRes.data.logs);
      setAnomalies(anomaliesRes.data.anomalies);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Hệ thống <span className="gradient-text">Bảo mật</span> 🔒</h1>
            <p className="page-subtitle">Giám sát các mối đe dọa, brute force, spam và hỗ trợ ra quyết định bằng AI.</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>Đang tải dữ liệu bảo mật...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            
            {/* AI assisted recommendations */}
            <section>
              <h2 className="section-heading" style={{ marginBottom: 'var(--space-3)' }}>🤖 Hỗ trợ quyết định (AI-Assisted Security Analysis)</h2>
              <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
                {anomalies.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>✅ Không phát hiện bất kỳ dấu hiệu truy cập bất thường nào trong 24 giờ qua.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {anomalies.map((anom, idx) => (
                      <div key={idx} className="glass-card" style={{ padding: '12px 16px', borderLeft: '4px solid var(--clr-rose-500)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p>Phát hiện IP <strong>{anom.ip}</strong> có hành vi đáng ngờ (<strong>{anom.count} lượt vi phạm</strong>).</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Các lỗi: {anom.actions.join(', ')}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="badge badge-danger" style={{ marginBottom: 4, display: 'inline-block' }}>Độ rủi ro: {anom.maxSeverity}</span>
                          <p style={{ fontSize: '0.8rem', color: 'var(--clr-primary-400)' }}>👉 Gợi ý hành động: <strong>{anom.recommendation === 'BLOCK_IP' ? 'Khóa IP ngay lập tức' : 'Theo dõi thêm'}</strong></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Detailed Security Logs Table */}
            <section>
              <h2 className="section-heading" style={{ marginBottom: 'var(--space-3)' }}>📋 Chi tiết Security Logs</h2>
              <div className="glass-card" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Địa chỉ IP</th>
                      <th>Tài khoản tác động</th>
                      <th>Hành động</th>
                      <th>Mức độ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>Chưa ghi nhận log bảo mật nào.</td>
                      </tr>
                    ) : (
                      logs.map(log => (
                        <tr key={log.id}>
                          <td>{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                          <td><strong>{log.ip}</strong></td>
                          <td>{log.user?.name || 'Khách (Chưa đăng nhập)'}</td>
                          <td><span className="badge badge-primary">{log.action}</span></td>
                          <td>
                            <span className={`badge ${log.severity === 'CRITICAL' || log.severity === 'HIGH' ? 'badge-danger' : log.severity === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                              {log.severity}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
