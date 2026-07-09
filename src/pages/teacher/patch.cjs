const fs = require('fs');
let code = fs.readFileSync('TeacherStats.jsx', 'utf8');

// 1. Update imports
code = code.replace(
  "import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';",
  "import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';"
);

// 2. Add formatDate function
const formatDateCode = `\nconst formatDate = (dateStr) => {\n  const d = new Date(dateStr);\n  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });\n};\n`;
code = code.replace('const COLORS = [', formatDateCode + '\nconst COLORS = [');

// 3. Update useEffect
const newUseEffect = `  useEffect(() => {
    setLoading(true);
    setError('');
    if (!examId) {
      api.get('/statistics/global')
        .then(res => setData({ isGlobal: true, ...res.data }))
        .catch(err => setError(err.response?.data?.message || 'Lỗi khi tải thống kê tổng quan'))
        .finally(() => setLoading(false));
    } else {
      api.get(\`/statistics/exam/\${examId}\`)
        .then(res => setData({ isGlobal: false, ...res.data }))
        .catch(err => setError(err.response?.data?.message || 'Lỗi khi tải thống kê bài kiểm tra'))
        .finally(() => setLoading(false));
    }
  }, [examId]);`;

code = code.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[examId\]\);/, newUseEffect);

// 4. Update the render logic to handle isGlobal
const renderGlobalCode = `
  if (data.isGlobal) {
    return (
      <div className="page-layout">
        <AnimatedBackground />
        <Sidebar />
        <main className="main-content fade-in">
          <div className="page-header">
            <div>
              <h1 className="page-title">🌍 Thống kê <span className="gradient-text">Tổng quan</span></h1>
              <p className="page-subtitle">Dữ liệu phân tích toàn hệ thống bài kiểm tra của bạn.</p>
            </div>
          </div>

          <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="stat-card glass-card">
              <span className="stat-icon">📚</span>
              <span className="stat-value">{data.totalExams}</span>
              <span className="stat-label">Tổng bài kiểm tra</span>
            </div>
            <div className="stat-card glass-card">
              <span className="stat-icon">👥</span>
              <span className="stat-value">{data.totalSubmissions}</span>
              <span className="stat-label">Tổng lượt nộp bài</span>
            </div>
            <div className="stat-card glass-card">
              <span className="stat-icon">📈</span>
              <span className="stat-value">{data.avgScore}</span>
              <span className="stat-label">Điểm trung bình (Hệ 100)</span>
            </div>
            <div className="stat-card glass-card">
              <span className="stat-icon">🚨</span>
              <span className="stat-value">{data.totalCheating}</span>
              <span className="stat-label">Lượt vi phạm quy chế</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>📈 Xu hướng nộp bài (7 ngày qua)</h3>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--clr-primary-500)" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="var(--clr-primary-500)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)', borderRadius: 8, color: '#fff' }} />
                    <Area type="monotone" dataKey="Lượt_nộp" stroke="var(--clr-primary-500)" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>📚 Cơ cấu Môn học</h3>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={data.subjectData} innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value" animationDuration={1500}>
                      {data.subjectData.map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)', borderRadius: 8, color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>📊 Phổ điểm toàn cục (Hệ 100)</h3>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={data.scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="Học_sinh" fill="var(--clr-emerald-500)" radius={[6, 6, 0, 0]} animationDuration={1500} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>🎯 Năng lực theo môn (Điểm TB)</h3>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer>
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.subjectPerformance}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                    <Radar name="Điểm TB" dataKey="Điểm_TB" stroke="var(--clr-fuchsia-500)" fill="var(--clr-fuchsia-500)" fillOpacity={0.4} animationDuration={1500} />
                    <Tooltip contentStyle={{ background: 'var(--bg-deep)', borderColor: 'var(--border-subtle)', borderRadius: 8, color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>🕒 Lịch sử nộp bài gần đây</h3>
            {data.recentSubmissions.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Học sinh</th>
                      <th>Bài kiểm tra</th>
                      <th>Thời gian nộp</th>
                      <th>Điểm số</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentSubmissions.map(sub => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 600 }}>{sub.student}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{sub.exam}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(sub.date)}</td>
                        <td>
                          <span className={\`badge \${sub.score >= 80 ? 'badge-primary' : sub.score >= 50 ? 'badge-success' : 'badge-danger'}\`}>
                            {sub.score?.toFixed(1) || 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Chưa có lượt nộp bài nào.</p>
            )}
          </div>
        </main>
      </div>
    );
  }
`;

code = code.replace(/const \{ exam, stats, submissions \} = data;/g, renderGlobalCode + '\n  const { exam, stats, submissions } = data;');

fs.writeFileSync('TeacherStats.jsx', code);
console.log('TeacherStats.jsx updated successfully.');
