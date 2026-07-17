import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getFullUploadUrl } from '../../api/client';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import { useAuth } from '../../context/AuthContext';
import { useScreenShare } from '../../hooks/useScreenShare';
import '../Dashboard.css';

function LiveCameraModal({ questionId, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let currentStream = null;
    const startCamera = async () => {
      try {
        if (currentStream) {
          currentStream.getTracks().forEach(t => t.stop());
        }
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        currentStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        setErrorMsg('Không thể mở camera. Vui lòng cấp quyền truy cập camera cho trình duyệt.');
      }
    };
    startCamera();
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode]);

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `essay_capture_${Date.now()}.png`, { type: 'image/png' });
        onCapture(questionId, file);
        onClose();
      }
    }, 'image/png', 0.9);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div className="glass-card fade-in" style={{
        width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          padding: '16px 20px', background: 'rgba(30,41,59,0.9)', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>📸 Chụp ảnh bài làm Tự luận trực tiếp</h3>
          <button onClick={onClose} className="btn btn-ghost" style={{ fontSize: '1.2rem' }}>✕</button>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {errorMsg ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#f43f5e' }}>
              ⚠️ {errorMsg}
            </div>
          ) : (
            <div style={{ width: '100%', position: 'relative', background: '#000', borderRadius: '12px', overflow: 'hidden', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', maxHeight: '420px', objectFit: 'contain' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
            >
              🔄 Đổi Camera
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTakePhoto}
              style={{ padding: '10px 28px', fontSize: '1.05rem', fontWeight: 700 }}
              disabled={!!errorMsg}
            >
              📸 Chụp Ảnh Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentTakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const timeSpentRef = useRef({});
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  const { user } = useAuth();
  const [examStarted, setExamStarted] = useState(false);
  const [screenGranted, setScreenGranted] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [screenError, setScreenError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);

  const checkIsMobileOrTouch = () => {
    return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window) ||
      (window.innerWidth <= 820);
  };

  const [essayImages, setEssayImages] = useState({});
  const [uploadingImage, setUploadingImage] = useState({});

  const activeQuestionRef = useRef(null);
  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);
  
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const isSelectingFileRef = useRef(false);
  const [gracePeriodSec, setGracePeriodSec] = useState(0);
  const gracePeriodSecRef = useRef(0);
  const [showCameraModalForQ, setShowCameraModalForQ] = useState(null);
  const cheatCountRef = useRef(0);
  const lastCheatTimeRef = useRef(0);
  const cheatLogsRef = useRef([]);
  const isAlertingRef = useRef(false);

  const startGracePeriod = (sec = 90) => {
    setGracePeriodSec(sec);
    gracePeriodSecRef.current = sec;
    setIsSelectingFile(true);
    isSelectingFileRef.current = true;
  };

  useEffect(() => {
    if (gracePeriodSec <= 0) return;
    const interval = setInterval(() => {
      setGracePeriodSec(prev => {
        const next = prev - 1;
        gracePeriodSecRef.current = next;
        if (next <= 0) {
          isSelectingFileRef.current = false;
          setIsSelectingFile(false);
        }
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gracePeriodSec]);

  const setSelectingFile = (val) => {
    setIsSelectingFile(val);
    isSelectingFileRef.current = val;
  };

  // Reset file selecting flag when window regains focus
  useEffect(() => {
    const handleWindowFocus = () => {
      if (isSelectingFileRef.current) {
        setTimeout(() => {
          setSelectingFile(false);
        }, 800); // 800ms delay to make sure focus change completes and screen settles
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  // Load Exam info on mount (DO NOT create submission until student clicks Start)
  useEffect(() => {
    let isMounted = true;
    api.get(`/exams/${examId}`)
      .then(({ data }) => {
        if (!isMounted) return;
        setExam(data);
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.response?.data?.message || 'Lỗi khi tải đề thi');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [examId]);

  // Global Timer
  useEffect(() => {
    if (!examStarted || timeRemaining === null || submitting) return;
    if (timeRemaining <= 0) {
      executeSubmit(true); // force submit
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [examStarted, timeRemaining, submitting]);

  // Per-question timer
  useEffect(() => {
    if (!examStarted || !activeQuestionId || submitting) return;
    questionTimerRef.current = setInterval(() => {
      timeSpentRef.current[activeQuestionId] = (timeSpentRef.current[activeQuestionId] || 0) + 1;
    }, 1000);
    return () => clearInterval(questionTimerRef.current);
  }, [examStarted, activeQuestionId, submitting]);

  // Handle cheat warnings and autocommit
  const handleCheatAttempt = (type) => {
    if (isAlertingRef.current) return;
    const now = Date.now();
    // Bỏ qua nếu sự kiện gian lận xảy ra quá sát nhau (dưới 2 giây)
    if (now - lastCheatTimeRef.current < 2000) return;
    
    isAlertingRef.current = true;
    lastCheatTimeRef.current = now;

    cheatCountRef.current += 1;
    setCheatCount(cheatCountRef.current);
    
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    cheatLogsRef.current.push(`Lần ${cheatCountRef.current} (${timestamp}): ${type}`);

    if (cheatCountRef.current >= 3) {
      alert(`CẢNH BÁO: Bạn đã vi phạm quy chế thi ${cheatCountRef.current} lần (${type}). Hệ thống sẽ tự động nộp bài!`);
      executeSubmit(true);
    } else {
      alert(`Cảnh báo vi phạm: Bạn không được phép ${type}! Vi phạm quá 3 lần, bài thi của bạn sẽ bị tự động nộp. (${cheatCountRef.current}/3)`);
      // Update the timestamp again after alert closes, because alert stops time
      lastCheatTimeRef.current = Date.now();
      // Allow a short buffer after alert closes before listening to events again
      setTimeout(() => {
        isAlertingRef.current = false;
        lastCheatTimeRef.current = Date.now();
      }, 500);
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (isMobileMode) return;
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
      setIsFullscreen(isFull);
      if (!isFull && examStarted && !submitting && !isMobileMode) {
        if (isSelectingFileRef.current || gracePeriodSecRef.current > 0) return; // Skip warnings when uploading files or during grace period
        handleCheatAttempt('Thoát chế độ toàn màn hình');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [examStarted, submitting]);

  // Tab change/minimization listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examStarted && !submitting) {
        if (isSelectingFileRef.current || gracePeriodSecRef.current > 0) return; // Skip warnings when uploading files
        handleCheatAttempt('Chuyển tab / Ẩn trình duyệt');
      }
    };
    
    const handleWindowBlur = () => {
      if (examStarted && !submitting) {
        if (isSelectingFileRef.current || gracePeriodSecRef.current > 0) return;
        handleCheatAttempt('Mở ứng dụng/cửa sổ khác (Mất tiêu điểm)');
      }
    };

    const handleKeyDown = (e) => {
      if (!examStarted || submitting) return;
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (DevTools/Source)
      if (e.keyCode === 123 || 
          (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || 
          (e.ctrlKey && e.keyCode === 85)) {
        e.preventDefault();
        handleCheatAttempt('Mở công cụ dành cho nhà phát triển');
        return;
      }
      // Prevent Ctrl+N, Ctrl+T, Ctrl+Shift+N (New window/tab)
      if (e.ctrlKey && (e.keyCode === 78 || e.keyCode === 84)) {
        e.preventDefault();
        handleCheatAttempt('Mở tab/cửa sổ mới');
        return;
      }
      // Prevent Alt+Tab (can't really prevent in browser, but we catch blur anyway)
      // Prevent Ctrl+C, Ctrl+V (Copy/Paste)
      if (e.ctrlKey && (e.keyCode === 67 || e.keyCode === 86)) {
        e.preventDefault();
        handleCheatAttempt('Sao chép / Dán dữ liệu');
        return;
      }
    };

    // Prevent context menu (Right click)
    const handleContextMenu = (e) => {
      if (examStarted && !submitting) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [examStarted, submitting]);

  const handleSelectAnswer = (qId, optionId, type) => {
    if (type === 'SINGLE_CHOICE') {
      setAnswers(prev => ({ ...prev, [qId]: optionId }));
    }
  };

  const handleEssayChange = (qId, text) => {
    setAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (window.confirm('Bạn có chắc chắn muốn nộp bài?')) {
      executeSubmit(false);
    }
  };

  const executeSubmit = async (forced = false) => {
    setSubmitting(true);
    try {
      // Build final answers payload combining text and image attachments
      const finalAnswers = { ...answers };
      Object.keys(essayImages).forEach(qId => {
        const imageUrl = essayImages[qId];
        if (imageUrl) {
          const textAns = finalAnswers[qId] || '';
          finalAnswers[qId] = `[Ảnh bài làm: ${imageUrl}] \n\n${textAns}`;
        }
      });

      const { data } = await api.post(`/submissions/${submissionId}/submit`, {
        answers: finalAnswers,
        timeSpentPerQuestion: timeSpentRef.current,
        cheatCount: cheatCountRef.current,
        cheatLogs: cheatLogsRef.current
      });
      // Exit fullscreen mode
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
      }
      // Navigate to result
      navigate(`/student/result/${data.submissionId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi nộp bài');
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (qId, file) => {
    if (!file) return;
    setUploadingImage(prev => ({ ...prev, [qId]: true }));
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEssayImages(prev => ({ ...prev, [qId]: data.url }));
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setUploadingImage(prev => ({ ...prev, [qId]: false }));
    }
  };

  // Hook chia sẻ màn hình — chỉ bật sau khi thi bắt đầu
  useScreenShare({
    examId,
    studentName: user?.name || 'Học sinh',
    enabled: examStarted && screenGranted,
    providedStream: screenStream
  });

  const requestScreenShare = async () => {
    setScreenError('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 5, max: 10 }, width: { ideal: 1280 } }, audio: false
      });
      setScreenStream(stream);
      setScreenGranted(true);
    } catch (err) {
      setScreenError('Bạn phải cho phép chia sẻ màn hình để bắt đầu làm bài. Vui lòng thử lại.');
    }
  };

  const startExam = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/submissions/start', { examId });
      setExam(data.exam);
      setSubmissionId(data.submission.id);
      if (data.exam.timeLimit) {
        setTimeRemaining(data.exam.timeLimit * 60);
      }
      if (data.exam.questions?.length > 0) {
        setActiveQuestionId(data.exam.questions[0].id);
        activeQuestionRef.current = data.exam.questions[0].id;
      }
      setLoading(false);

      const isMobile = checkIsMobileOrTouch();
      if (isMobile) {
        setIsMobileMode(true);
        setIsFullscreen(true);
        setExamStarted(true);
        return;
      }

      const elem = document.documentElement;
      const requestFullscreen = elem.requestFullscreen || elem.mozRequestFullScreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen;
      if (requestFullscreen) {
        elem.requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
            setExamStarted(true);
          })
          .catch(err => {
            console.log('Fullscreen failed or unsupported on device, allowing safe mode:', err);
            setIsMobileMode(true);
            setIsFullscreen(true);
            setExamStarted(true);
          });
      } else {
        setIsMobileMode(true);
        setIsFullscreen(true);
        setExamStarted(true);
      }
    } catch (err) {
      setLoading(false);
      alert(err.response?.data?.message || 'Không thể bắt đầu làm bài');
    }
  };

  const forceFullscreen = () => {
    const isMobile = checkIsMobileOrTouch();
    if (isMobile) {
      setIsMobileMode(true);
      setIsFullscreen(true);
      return;
    }
    const elem = document.documentElement;
    const reqFs = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
    if (reqFs) {
      reqFs.call(elem)
        .then(() => setIsFullscreen(true))
        .catch(err => {
          console.log('Fullscreen failed, switching to safe mobile mode:', err);
          setIsMobileMode(true);
          setIsFullscreen(true);
        });
    } else {
      setIsMobileMode(true);
      setIsFullscreen(true);
    }
  };

  if (loading) {
    return (
      <div className="page-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedBackground />
        <div className="spinner" style={{ width: 48, height: 48 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedBackground />
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>❌ Không thể làm bài</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/student/exams')} style={{ marginTop: '1rem' }}>Quay lại</button>
        </div>
      </div>
    );
  }

  const totalQuestions = exam?.questions?.length || 0;
  const answeredQuestions = exam?.questions?.filter(q => !!answers[q.id]).length || 0;
  const progressPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const formatTime = (sec) => {
    if (sec === null) return '--:--';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!examStarted) {
    return (
      <div className="page-layout" style={{ justifyContent: 'center', alignItems: 'center', padding: 'var(--space-6)' }}>
        <AnimatedBackground />
        <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: 'var(--space-8)', textAlign: 'center' }}>
          <span style={{ fontSize: '3.5rem' }}>📝</span>
          <h1 className="gradient-text" style={{ fontSize: '2rem', marginTop: 'var(--space-4)', fontWeight: 800 }}>XÁC NHẬN LÀM BÀI</h1>
          <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-2)', color: 'var(--text-primary)' }}>{exam.title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 'var(--space-2)' }}>
            Môn học: <strong>{exam.subject}</strong> • Khối: <strong>Lớp {exam.grade}</strong>
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
            marginTop: 'var(--space-6)', textAlign: 'left',
            fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)'
          }}>
            <p style={{ fontWeight: 600, color: 'var(--clr-primary-400)', marginBottom: '8px' }}>⚠️ QUY CHẾ VÀ HƯỚNG DẪN THI:</p>
            <p>1. Bài thi gồm <strong>{exam.questions?.length || 0} câu hỏi</strong>, thời gian làm bài là <strong>{exam.timeLimit} phút</strong>.</p>
            <p>2. Khi bắt đầu, hệ thống sẽ bắt buộc chạy ở chế độ <strong>Toàn màn hình (Fullscreen)</strong>.</p>
            <p>3. Không được thoát chế độ toàn màn hình hoặc chuyển tab. Vi phạm quá 3 lần sẽ bị <strong>tự động nộp bài</strong>.</p>
            <p style={{ color: 'var(--clr-rose-500)', fontWeight: 600 }}>4. 🖥️ BẮT BUỘC: Bạn phải <strong>chia sẻ toàn bộ màn hình</strong> cho giáo viên giám sát trong suốt quá trình thi.</p>
          </div>

          {/* Bước chia sẻ màn hình */}
          {!screenGranted ? (
            <div style={{ marginTop: 'var(--space-6)' }}>
              <div style={{ padding: '16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, marginBottom: 16 }}>
                <p style={{ margin: 0, color: 'var(--clr-primary-400)', fontWeight: 600, fontSize: '0.95rem' }}>📡 BƯỚC BẮT BUỘC: Cho phép chia sẻ màn hình</p>
                <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nhấn nút bên dưới, chọn "Toàn bộ màn hình" rồi bấm "Chia sẻ" để tiếp tục.</p>
              </div>
              {screenError && (
                <p style={{ color: 'var(--clr-rose-500)', fontSize: '0.85rem', marginBottom: 12 }}>⚠️ {screenError}</p>
              )}
              <button className="btn btn-primary btn-lg" onClick={requestScreenShare} style={{ width: '100%' }}>
                🖥️ Cho phép chia sẻ màn hình
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 'var(--space-6)' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, marginBottom: 20 }}>
                <p style={{ margin: 0, color: '#10b981', fontWeight: 600 }}>✅ Đã xác nhận chia sẻ màn hình</p>
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={() => navigate('/student/exams')}>Quay lại</button>
                <button className="btn btn-primary btn-lg" onClick={startExam} disabled={loading} id="start-exam-confirm">
                  🚀 Bắt đầu làm bài
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <AnimatedBackground />

      {gracePeriodSec > 0 && (
        <div className="fade-in" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: 'linear-gradient(90deg, #10b981, #059669)', color: '#fff',
          padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)', fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>🛡️</span>
            <span>CHẾ ĐỘ ÂN HẠN NỘP ẢNH TỰ LUẬN: Còn <strong>{gracePeriodSec} giây</strong> — Hệ thống tạm dừng cảnh báo vi phạm màn hình để bạn thao tác chụp/chọn ảnh.</span>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: 'rgba(0,0,0,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            onClick={() => { setGracePeriodSec(0); gracePeriodSecRef.current = 0; setSelectingFile(false); }}
          >
            Hoàn tất
          </button>
        </div>
      )}
      
      {examStarted && !isFullscreen && !isSelectingFile && gracePeriodSec <= 0 && !isMobileMode && (
        <div className="fullscreen-blocker fade-in" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 3, 5, 0.96)', zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 'var(--space-4)', padding: 'var(--space-6)', textAlign: 'center',
          backdropFilter: 'blur(20px)', color: 'var(--text-primary)'
        }}>
          <span style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px var(--clr-rose-500))' }}>⚠️</span>
          <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800 }}>VI PHẠM QUY CHẾ THI</h2>
          <p style={{ maxWidth: '500px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Bạn đã thoát chế độ toàn màn hình. Để bảo đảm tính minh bạch, bạn không thể xem câu hỏi hoặc làm bài ở chế độ thường.
          </p>
          <p style={{ color: 'var(--clr-primary-400)', fontWeight: 600 }}>
            Số lần vi phạm: {cheatCount}/3 (Vi phạm quá 3 lần, hệ thống sẽ tự động nộp bài thi!)
          </p>
          <button className="btn btn-primary btn-lg" onClick={forceFullscreen} style={{ marginTop: 'var(--space-4)' }}>
            🖥️ Quay lại chế độ Toàn màn hình
          </button>
        </div>
      )}
      
      {/* Floating Sticky Mobile Bar for Navigation */}
      {isMobileMode && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          background: 'rgba(10, 14, 35, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: timeRemaining < 60 ? 'var(--clr-rose-500)' : '#fff' }}>
            <span>⏱️ {formatTime(timeRemaining)}</span>
          </div>
          <button
            onClick={() => setShowMobilePalette(true)}
            className="btn btn-outline btn-sm"
            style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '0.82rem' }}
          >
            📋 Bảng câu hỏi ({answeredQuestions}/{totalQuestions})
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary btn-sm"
            style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '0.82rem' }}
          >
            ✅ Nộp bài
          </button>
        </div>
      )}

      {/* Mobile Question Palette Modal Drawer */}
      {isMobileMode && showMobilePalette && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setShowMobilePalette(false)}
        >
          <div 
            style={{
              width: '100%',
              maxHeight: '80vh',
              background: '#0a0e23',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              borderTop: '1px solid rgba(255,255,255,0.15)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>📋 Danh sách câu hỏi ({totalQuestions} câu)</h3>
              <button onClick={() => setShowMobilePalette(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.4rem' }}>✕</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span>Đã làm: {answeredQuestions}/{totalQuestions}</span>
              <span>Tiến độ: {progressPct}%</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              {exam.questions.map((q, i) => {
                const isAnswered = !!answers[q.id];
                const isActive = activeQuestionId === q.id;
                return (
                  <a
                    href={`#q-${q.id}`}
                    key={q.id}
                    onClick={() => { setActiveQuestionId(q.id); setShowMobilePalette(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      height: 42, borderRadius: '8px',
                      fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
                      background: isActive ? 'var(--clr-primary-500)' : isAnswered ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)',
                      border: `1px solid ${isActive ? 'var(--clr-primary-400)' : isAnswered ? 'var(--clr-emerald-500)' : 'var(--border-subtle)'}`,
                      color: isActive ? '#fff' : 'var(--text-primary)',
                      textDecoration: 'none'
                    }}
                  >
                    {i + 1}
                  </a>
                );
              })}
            </div>

            <button 
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '10px' }}
              onClick={() => { setShowMobilePalette(false); handleSubmit(); }}
              disabled={submitting}
            >
              ✅ Nộp bài thi ngay
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar for Navigation */}
      {!isMobileMode && (
        <aside style={{
          width: 300,
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
          background: 'var(--glass-bg)',
          borderLeft: '1px solid var(--glass-border)',
          backdropFilter: 'var(--glass-blur)',
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: '2rem', color: timeRemaining < 60 ? 'var(--clr-rose-500)' : 'var(--text-primary)' }}>
              ⏱️ {formatTime(timeRemaining)}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Thời gian còn lại</p>
          </div>

          <div style={{ marginBottom: 'var(--space-4)', padding: '0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span>Tiến độ: {answeredQuestions}/{totalQuestions} câu</span>
              <span style={{ fontWeight: 600, color: 'var(--clr-primary-400)' }}>{progressPct}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
          
          <div className="divider" style={{ margin: 'var(--space-2) 0 var(--space-4)' }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, overflowY: 'auto' }}>
            {exam.questions.map((q, i) => {
              const isAnswered = !!answers[q.id];
              const isActive = activeQuestionId === q.id;
              return (
                <a 
                  href={`#q-${q.id}`}
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: 36, borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer',
                    background: isActive ? 'var(--clr-primary-500)' : isAnswered ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isActive ? 'var(--clr-primary-400)' : isAnswered ? 'var(--clr-emerald-500)' : 'var(--border-subtle)'}`,
                    color: isActive ? '#fff' : 'var(--text-primary)',
                    textDecoration: 'none'
                  }}
                >
                  {i + 1}
                </a>
              );
            })}
          </div>

          <div className="divider" />
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', background: 'var(--gradient-cyan)' }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Đang chấm điểm...' : '✅ Nộp bài ngay'}
          </button>
        </aside>
      )}

      {/* Main Exam Content */}
      <main className="main-content fade-in" style={{
        marginRight: isMobileMode ? 0 : 300,
        marginLeft: 0,
        width: isMobileMode ? '100%' : 'auto',
        padding: isMobileMode ? '14px' : 'var(--space-6)'
      }}>
        <div className="glass-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <h1 className="page-title">{exam.title}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{exam.subject} • Lớp {exam.grade}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {exam.questions.map((q, index) => {
            const showSection = q.section && (index === 0 || q.section !== exam.questions[index - 1]?.section);
            return (
              <React.Fragment key={`wrap-${q.id}`}>
                {showSection && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '12px 20px', 
                    background: 'var(--gradient-primary)', 
                    borderRadius: 'var(--radius-md)', 
                    color: '#fff', 
                    fontWeight: 700, 
                    fontSize: '1.2rem', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {q.section}
                  </div>
                )}
                <div 
                  id={`q-${q.id}`}
                  className="glass-card" 
                  style={{
                    padding: isMobileMode ? '14px' : 'var(--space-6)',
                    borderLeft: activeQuestionId === q.id ? '4px solid var(--clr-primary-400)' : '',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    maxWidth: '100%'
                  }}
                  onMouseEnter={() => setActiveQuestionId(q.id)}
                >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ color: 'var(--clr-primary-400)' }}>Câu {index + 1} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({q.points} điểm)</span></h3>
                {q.type === 'ESSAY' && <span className="badge badge-warning">Tự luận</span>}
              </div>
              
              <div 
                className="question-content" 
                style={{
                  fontSize: '1.1rem',
                  marginBottom: 'var(--space-4)',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  maxWidth: '100%',
                  wordBreak: 'break-word'
                }}
                dangerouslySetInnerHTML={q.content && /<[a-z][\s\S]*>/i.test(q.content) ? { __html: q.content } : undefined}
              >
                {!(q.content && /<[a-z][\s\S]*>/i.test(q.content)) ? q.content : undefined}
              </div>

              {q.imageUrl && (
                <div className="svg-wrapper-render" style={{ marginBottom: 'var(--space-6)', textAlign: 'center', background: q.imageUrl.startsWith('data:image/svg+xml,') ? '#fff' : 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 'var(--radius-md)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  {q.imageUrl.startsWith('data:image/svg+xml,') ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: decodeURIComponent(q.imageUrl.replace('data:image/svg+xml,', '')) }}
                      style={{ display: 'inline-block', maxWidth: '100%', width: '100%' }}
                    />
                  ) : (
                    <img
                      src={q.imageUrl}
                      alt={`Minh họa câu ${index + 1}`}
                      style={{ maxHeight: 380, maxWidth: '100%', borderRadius: '4px', border: '1px solid var(--border-subtle)', objectFit: 'contain' }}
                    />
                  )}
                </div>
              )}

              {q.type === 'SINGLE_CHOICE' && q.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {q.options.map(opt => {
                    const selected = answers[q.id] === opt.id;
                    return (
                      <div 
                        key={opt.id}
                        onClick={() => handleSelectAnswer(q.id, opt.id, 'SINGLE_CHOICE')}
                        className={`option-item-interactive ${selected ? 'active' : ''}`}
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${selected ? 'var(--clr-primary-500)' : 'var(--border-subtle)'}`,
                          background: selected ? 'rgba(244,63,94,0.12)' : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer',
                          display: 'flex', gap: '1rem',
                          alignItems: 'center',
                          transition: 'all var(--transition-fast)',
                          boxShadow: selected ? 'var(--shadow-glow-primary)' : 'none',
                          transform: selected ? 'scale(1.01) translateX(4px)' : 'none',
                        }}
                      >
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: selected ? 'white' : 'var(--text-secondary)',
                          background: selected ? 'var(--clr-primary-500)' : 'rgba(255,255,255,0.05)',
                          width: '28px', height: '28px',
                          borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.85rem'
                        }}>{opt.id}</span>
                        <span>{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'ESSAY' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <textarea 
                    className="input"
                    style={{ minHeight: '150px', resize: 'vertical' }}
                    placeholder="Nhập câu trả lời của bạn..."
                    value={answers[q.id] || ''}
                    onChange={e => handleEssayChange(q.id, e.target.value)}
                  />
                  
                  {/* Image attachment area */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    padding: 'var(--space-3)', background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        📷 Nộp ảnh bài làm tự luận (Giữ nguyên toàn màn hình hoặc dùng chế độ ân hạn 90s):
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                          onClick={() => setShowCameraModalForQ(q.id)}
                          disabled={uploadingImage[q.id]}
                        >
                          📸 Chụp bằng Camera
                        </button>

                        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span>📎 Chọn ảnh từ máy (Ân hạn 90s)</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onClick={() => startGracePeriod(90)}
                            onChange={e => {
                              setGracePeriodSec(0);
                              gracePeriodSecRef.current = 0;
                              setSelectingFile(false);
                              handleImageUpload(q.id, e.target.files[0]);
                            }}
                            disabled={uploadingImage[q.id]}
                          />
                        </label>
                      </div>
                    </div>

                    {uploadingImage[q.id] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <span className="spinner" style={{ width: 14, height: 14 }} />
                        <span>Đang tải ảnh lên...</span>
                      </div>
                    )}

                    {essayImages[q.id] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: 'var(--radius-sm)', position: 'relative' }}>
                        <img 
                          src={getFullUploadUrl(essayImages[q.id])} 
                          alt="Bài làm đính kèm" 
                          style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-strong)' }} 
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.82rem', color: 'var(--clr-emerald-400)', fontWeight: 600 }}>✓ Đã tải ảnh lên thành công</p>
                          <a href={getFullUploadUrl(essayImages[q.id])} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--clr-primary-400)', textDecoration: 'none' }}>
                            Xem ảnh lớn ↗
                          </a>
                        </div>
                        <button 
                          type="button"
                          className="btn btn-ghost btn-sm" 
                          onClick={() => setEssayImages(prev => ({ ...prev, [q.id]: null }))}
                          style={{ color: 'var(--clr-rose-500)', padding: '4px 8px' }}
                        >
                          ✕ Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            </React.Fragment>
          );
        })}
        </div>

        {showCameraModalForQ && (
          <LiveCameraModal
            questionId={showCameraModalForQ}
            onCapture={(qId, file) => handleImageUpload(qId, file)}
            onClose={() => setShowCameraModalForQ(null)}
          />
        )}
      </main>
    </div>
  );
}
