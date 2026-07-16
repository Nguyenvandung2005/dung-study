import { useEffect, useState } from 'react';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import TimeFilter from '../../components/ui/TimeFilter';
import api from '../../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timeRange, setTimeRange] = useState({ type: 'all' });

  const fetchUsers = () => {
    setLoading(true);
    const timeParams = `&timeType=${timeRange.type}&timeStart=${timeRange.start || ''}&timeEnd=${timeRange.end || ''}`;
    api.get(`/admin/users?search=${search}&role=${roleFilter}&grade=${gradeFilter}&status=${statusFilter}${timeParams}`)
      .then(({ data }) => setUsers(data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, gradeFilter, statusFilter, timeRange]);

  const handleLockUser = async (id, isLocked) => {
    try {
      await api.patch(`/admin/users/${id}/lock`, { isLocked: !isLocked });
      setUsers(users.map(u => u.id === id ? { ...u, isLocked: !isLocked } : u));
    } catch (e) {
      alert('Không thể thực hiện thao tác');
    }
  };

  const handleRoleChange = async (id, currentRole) => {
    const nextRole = currentRole === 'STUDENT' ? 'TEACHER' : currentRole === 'TEACHER' ? 'ADMIN' : 'STUDENT';
    try {
      await api.patch(`/admin/users/${id}/role`, { role: nextRole });
      setUsers(users.map(u => u.id === id ? { ...u, role: nextRole } : u));
    } catch (e) {
      alert('Không thể cập nhật quyền');
    }
  };

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Quản lý <span className="gradient-text">Người dùng</span> 👥</h1>
            <p className="page-subtitle">Quản lý phân quyền, khóa và kích hoạt tài khoản trong hệ thống.</p>
          </div>
          <div>
            <TimeFilter timeRange={timeRange} setTimeRange={setTimeRange} />
          </div>
        </div>

        {/* Filters & Search */}
        <div className="glass-card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input type="text" className="input" placeholder="Tìm kiếm tên hoặc email..."
            style={{ flex: 1, minWidth: '200px' }}
            value={search} onChange={e => setSearch(e.target.value)} />

          <select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="">Tất cả Vai trò</option>
            <option value="STUDENT">Học sinh</option>
            <option value="TEACHER">Giáo viên</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select className="input" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="">Tất cả Khối</option>
            <option value="10">Khối 10</option>
            <option value="11">Khối 11</option>
            <option value="12">Khối 12</option>
          </select>

          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="">Tất cả Trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>

          <button className="btn btn-primary" onClick={fetchUsers}>🔎 Tìm kiếm</button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>Đang tải danh sách người dùng...</p>
          </div>
        ) : (
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Khối lớp</th>
                  <th>Ngày đăng ký</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>Không tìm thấy người dùng nào.</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <button className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : u.role === 'TEACHER' ? 'badge-primary' : 'badge-success'}`}
                          onClick={() => handleRoleChange(u.id, u.role)}
                          style={{ border: 'none', cursor: 'pointer' }}>
                          {u.role === 'ADMIN' ? 'Admin' : u.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                        </button>
                      </td>
                      <td>{u.grade ? `Lớp ${u.grade}` : '—'}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span className={`badge ${u.isLocked ? 'badge-danger' : 'badge-success'}`}>
                          {u.isLocked ? 'Đã khóa' : 'Đang hoạt động'}
                        </span>
                      </td>
                      <td>
                        <button className={`btn btn-sm ${u.isLocked ? 'btn-outline' : 'btn-danger'}`}
                          onClick={() => handleLockUser(u.id, u.isLocked)}>
                          {u.isLocked ? '🔓 Mở khóa' : '🔒 Khóa'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
