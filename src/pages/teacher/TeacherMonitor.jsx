import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMonitor } from '../../hooks/useMonitor';
import api from '../../api/client';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import Sidebar from '../../components/ui/Sidebar';
import '../Dashboard.css';

function StudentScreen({ student, stream, onClick }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      onClick={() => onClick(student, stream)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = '1px solid var(--clr-primary-500)';
        e.currentTarget.style.boxShadow = '0 0 16px rgba(245,158,11,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', background: '#000', display: 'block' }}
        />
      ) : (
        <div style={{
          width: '100%', aspectRatio: '16/9',
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8, color: 'var(--text-muted)'
        }}>
          <span style={{ fontSize: '2rem' }}>⏳</span>
          <span style={{ fontSize: '0.8rem' }}>Đang kết nối...</span>
        </div>
      )}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '6px 10px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
          👤 {student.name}
        </span>
        {stream && (
          <span style={{
            fontSize: '0.7rem', background: '#10b981',
            color: '#fff', borderRadius: 99, padding: '2px 8px'
          }}>● LIVE</span>
        )}
      </div>
    </div>
  );
}

function FullscreenModal({ student, stream, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  if (!student) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16
      }}
      onClick={onClose}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>👤 {student.name}</span>
        {stream && <span style={{ fontSize: '0.8rem', background: '#10b981', borderRadius: 99, padding: '2px 10px' }}>● LIVE</span>}
      </div>
      <div
        style={{ width: '90vw', maxWidth: '1200px', border: '2px solid var(--clr-primary-500)', borderRadius: 12, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {stream ? (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', background: '#000' }} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <span>Chưa có stream từ học sinh này</span>
          </div>
        )}
      </div>
      <button className="btn btn-outline" onClick={onClose}>✕ Đóng</button>
    </div>
  );
}

export default function TeacherMonitor() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [focusedStudent, setFocusedStudent] = useState(null);
  const [focusedStream, setFocusedStream] = useState(null);

  const { students, streams, requestStream } = useMonitor({
    examId,
    teacherName: user?.name || 'Giáo viên',
    enabled: true
  });

  useEffect(() => {
    api.get(`/exams/${examId}`).then(({ data }) => setExam(data)).catch(() => {});
  }, [examId]);

  const handleStudentClick = (student, stream) => {
    setFocusedStudent(student);
    setFocusedStream(stream);
    if (!stream) requestStream(student.socketId);
  };

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
              🖥️ Phòng Giám Sát — {exam?.title || 'Đang tải...'}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {students.length} học sinh đang làm bài • Nhấp vào màn hình để xem toàn màn hình
            </p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>← Quay lại</button>
        </div>

        {/* Status bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '12px 20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12, flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>{Object.keys(streams).length}</span> / {students.length} đã kết nối stream
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            🔴 Luồng video được truyền trực tiếp qua WebRTC — không qua server
          </span>
        </div>

        {students.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
            <span style={{ fontSize: '4rem' }}>👁️</span>
            <h3 style={{ marginTop: 16, color: 'var(--text-primary)' }}>Chờ học sinh vào phòng thi...</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '8px auto 0' }}>
              Phòng giám sát đang hoạt động. Khi học sinh mở bài thi <strong>#{examId.slice(0, 8)}</strong>, màn hình của họ sẽ xuất hiện tại đây tự động.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16
          }}>
            {students.map(student => (
              <StudentScreen
                key={student.socketId}
                student={student}
                stream={streams[student.socketId] || null}
                onClick={handleStudentClick}
              />
            ))}
          </div>
        )}
      </main>

      {/* Fullscreen focus modal */}
      {focusedStudent && (
        <FullscreenModal
          student={focusedStudent}
          stream={focusedStream}
          onClose={() => { setFocusedStudent(null); setFocusedStream(null); }}
        />
      )}
    </div>
  );
}
