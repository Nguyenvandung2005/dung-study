import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import TimeFilter from '../../components/ui/TimeFilter';
import api, { getFullUploadUrl } from '../../api/client';


const parseEssayAnswer = (answerText) => {
  if (!answerText) return { imageUrl: null, text: '' };
  const imgMatch = answerText.match(/\[Ảnh bài làm:\s*(.*?)\]/);
  if (imgMatch) {
    const imageUrl = imgMatch[1];
    const text = answerText.replace(/\[Ảnh bài làm:\s*.*?\]/, '').trim();
    return { imageUrl, text };
  }
  return { imageUrl: null, text: answerText };
};

export default function TeacherGrading() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingTask, setGradingTask] = useState(null); // Which task is currently being graded
  const [teacherScores, setTeacherScores] = useState({});
  const [teacherRemarks, setTeacherRemarks] = useState({});
  const [timeRange, setTimeRange] = useState({ type: 'all' });

  // Filters
  const [filterExam, setFilterExam] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [timeRange]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const timeParams = `?timeType=${timeRange.type}&timeStart=${timeRange.start || ''}&timeEnd=${timeRange.end || ''}`;
      const res = await api.get(`/submissions/pending-grading${timeParams}`);
      setTasks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startGrading = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const res = await api.get(`/submissions/${task.submissionId}`);
      setGradingTask({ task, submissionDetail: res.data });
      
      const initialScores = {};
      const initialRemarks = {};
      res.data.answers.forEach(a => {
        if (a.question.type === 'ESSAY') {
          initialScores[a.id] = a.teacherScore ?? a.aiScore ?? 0;
          initialRemarks[a.id] = a.teacherRemark ?? '';
        }
      });
      setTeacherScores(initialScores);
      setTeacherRemarks(initialRemarks);
    } catch (e) {
      alert('Không thể tải chi tiết bài làm');
    }
  };

  const submitGrade = async () => {
    try {
      const grades = {};
      Object.keys(teacherScores).forEach(answerId => {
        grades[answerId] = {
          teacherScore: parseFloat(teacherScores[answerId]),
          teacherRemark: teacherRemarks[answerId]
        };
      });

      await api.put(`/submissions/${gradingTask.submissionDetail.id}/grade-essay`, { grades });
      alert('Chấm bài thành công!');
      setGradingTask(null);
      fetchTasks(); // Refresh list
    } catch (e) {
      alert('Lỗi khi lưu điểm');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterExam && task.submission.exam.title !== filterExam) return false;
    if (filterStatus && task.status !== filterStatus) return false;
    return true;
  });

  const uniqueExams = [...new Set(tasks.map(t => t.submission.exam.title))];

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">✏️ Chấm bài <span className="gradient-text">Tự luận</span></h1>
            <p className="page-subtitle">Xem điểm tự chấm bởi Gemini AI và thực hiện điều chỉnh nếu muốn.</p>
          </div>
          <div>
            <TimeFilter timeRange={timeRange} setTimeRange={setTimeRange} />
          </div>
        </div>

        {gradingTask ? (
          <div className="grading-interface fade-in">
            <div className="bento-card glow-border cascade-in" style={{ '--glow-color': '#f59e0b', padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <h2 style={{ color: 'var(--clr-primary-400)' }}>Học sinh: {gradingTask.task.submission.user.name}</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Bài thi: {gradingTask.task.submission.exam.title}</p>
                </div>
                <button className="btn btn-outline" onClick={() => setGradingTask(null)}>Quay lại</button>
              </div>

              {gradingTask.submissionDetail.answers.filter(a => a.question.type === 'ESSAY').map((answer, idx) => (
                <div key={answer.id} style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-6)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)' }}>
                  <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Câu {idx + 1} ({answer.question.points} điểm)</span>
                  </h3>
                  <div style={{ padding: 'var(--space-4)', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Đề bài:</p>
                    <p dangerouslySetInnerHTML={/<[a-z][\s\S]*>/i.test(answer.question.content) ? { __html: answer.question.content } : undefined}>
                      {!(/<[a-z][\s\S]*>/i.test(answer.question.content)) ? answer.question.content : undefined}
                    </p>
                  </div>
                  
                  <div style={{ padding: 'var(--space-4)', background: 'rgba(244,63,94,0.1)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                    <p style={{ color: 'var(--clr-primary-400)', marginBottom: '8px', fontWeight: 'bold' }}>✍️ Bài làm của học sinh:</p>
                    {(() => {
                      const { imageUrl, text } = parseEssayAnswer(answer.answer);
                      return (
                        <>
                          {imageUrl && (
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '6px' }}>📷 Ảnh đính kèm (nhấp để phóng to):</p>
                              <a href={getFullUploadUrl(imageUrl)} target="_blank" rel="noreferrer">
                                <img src={getFullUploadUrl(imageUrl)} alt="Ảnh bài làm" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', cursor: 'zoom-in' }} />
                              </a>
                            </div>
                          )}
                          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                            {text || (!imageUrl && <i style={{ color: 'var(--text-muted)' }}>(Bỏ trống)</i>)}
                          </p>
                        </>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                    <div style={{ background: 'rgba(16,185,129,0.1)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ color: 'var(--clr-emerald-500)', marginBottom: 'var(--space-2)' }}>🤖 AI Đánh giá</h4>
                      <div style={{ marginBottom: 'var(--space-3)' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{answer.aiScore ?? 0}</span>
                        <span style={{ color: 'var(--text-secondary)' }}> / {answer.question.points}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{answer.aiRemark || 'Không có nhận xét'}</p>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}>
                      <h4 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>👩‍🏫 Chấm điểm (Giáo viên)</h4>
                      
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Điểm số (Tối đa {answer.question.points})</label>
                      <input 
                        type="number" 
                        className="input" 
                        style={{ marginBottom: 'var(--space-4)' }}
                        min={0} max={answer.question.points} step={0.25}
                        value={teacherScores[answer.id]}
                        onChange={e => setTeacherScores({...teacherScores, [answer.id]: e.target.value})}
                      />

                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nhận xét cho học sinh</label>
                      <textarea 
                        className="input" 
                        style={{ minHeight: '120px' }}
                        value={teacherRemarks[answer.id]}
                        onChange={e => setTeacherRemarks({...teacherRemarks, [answer.id]: e.target.value})}
                        placeholder="Nhập nhận xét của bạn vào đây..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 'var(--space-6)' }}>
                <button className="btn btn-outline" onClick={() => setGradingTask(null)}>Hủy</button>
                <button className="btn btn-primary" onClick={submitGrade}>Lưu điểm & Hoàn thành</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bento-card glow-border cascade-in" style={{ '--cascade-delay': '100ms', '--glow-color': '#10b981', overflowX: 'auto', padding: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 16px' }} />
                <p>Đang tải danh sách chờ chấm...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Tuyệt vời!</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Không có bài tự luận nào cần chấm lúc này. Bạn đã xử lý xong mọi việc!</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <select className="input" value={filterExam} onChange={e => setFilterExam(e.target.value)} style={{ width: '250px' }}>
                    <option value="">Tất cả bài thi</option>
                    {uniqueExams.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                  <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '200px' }}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="AI_GRADED">🤖 Đã chấm sơ bộ bằng AI</option>
                    <option value="PENDING">⏳ Đang chờ chấm</option>
                  </select>
                </div>
                {filteredTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                    <p>Không tìm thấy bài làm nào khớp với bộ lọc.</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Học sinh</th>
                        <th>Bài thi</th>
                        <th>Trạng thái AI</th>
                        <th>Thời gian nộp</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map(task => (
                        <tr key={task.id}>
                      <td><strong>{task.submission.user.name}</strong></td>
                      <td>{task.submission.exam.title}</td>
                      <td>
                        {task.status === 'AI_GRADED' ? (
                          <span className="badge badge-success">🤖 AI đã chấm sơ bộ</span>
                        ) : (
                          <span className="badge badge-warning">⏳ Chờ chấm</span>
                        )}
                      </td>
                      <td>{new Date(task.createdAt).toLocaleString('vi-VN')}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => startGrading(task.id)}>
                          Bắt đầu chấm
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
