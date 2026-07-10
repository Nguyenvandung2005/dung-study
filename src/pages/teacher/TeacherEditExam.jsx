import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import AnimatedBackground from '../../components/ui/AnimatedBackground';
import api from '../../api/client';
import ExamForm from '../../components/exam/ExamForm';
import './TeacherCreateExam.css';

export default function TeacherEditExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await api.get(`/exams/${examId}`);
        // Map data back to form state
        const meta = {
          title: data.title,
          subject: data.subject,
          grade: data.grade,
          timeLimit: data.timeLimit,
          description: data.description || '',
          startAt: data.startAt || '',
          endAt: data.endAt || '',
        };

        const questions = data.questions.map(q => {
          let correctAnswer = q.correctAnswer || '';
          // backend correctAnswer is an array of strings like ['A']
          if (Array.isArray(correctAnswer) && correctAnswer.length > 0) {
            correctAnswer = String('ABCDE'.indexOf(correctAnswer[0].toUpperCase()));
          }

          return {
            id: q.id || crypto.randomUUID(),
            type: q.type,
            content: q.content,
            contentIsHtml: q.content.includes('<'),
            options: q.type === 'ESSAY' 
              ? ['', '', '', '']
              : (Array.isArray(q.options) 
                  ? q.options.map(o => o.text || o) 
                  : ['', '', '', '']),
            correctAnswer,
            points: q.points || 1,
            explanation: q.explanation || '',
            imageUrl: q.imageUrl || '',
          };
        });

        setInitialData({ meta, questions });
      } catch (e) {
        setError(e.response?.data?.message || 'Không thể tải dữ liệu đề thi');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  const handleSave = async (meta, questions, publish) => {
    const processDate = (d) => d ? new Date(d).toISOString() : null;
    const payloadMeta = {
      ...meta,
      startAt: processDate(meta.startAt),
      endAt: processDate(meta.endAt),
      grade: Number(meta.grade),
      timeLimit: Number(meta.timeLimit),
      isPublished: publish,
    };
    await api.put(`/exams/${examId}`, payloadMeta);

    // 2. Cập nhật câu hỏi (ghi đè toàn bộ)
    const payloadQuestions = {
      replaceAll: true,
      questions: questions.map((q, idx) => ({
        order: idx + 1,
        type: q.type,
        content: q.content,
        options: q.type !== 'ESSAY' ? q.options : [],
        correctAnswer: q.type !== 'ESSAY' ? q.correctAnswer : null,
        points: q.points,
        explanation: q.explanation,
        imageUrl: q.imageUrl || null,
      }))
    };
    await api.post(`/exams/${examId}/questions`, payloadQuestions);

    navigate(`/teacher?updated=${examId}`);
  };

  return (
    <div className="page-layout">
      <AnimatedBackground />
      <Sidebar />
      <main className="main-content">
        {loading ? (
          <div className="loading-state glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto' }} />
            <p>Đang tải dữ liệu bài thi...</p>
          </div>
        ) : error ? (
          <div className="empty-state glass-card">
            <h2>❌ Có lỗi xảy ra</h2>
            <p>{error}</p>
            <Link to="/teacher" className="btn btn-primary">Quay lại Bảng điều khiển</Link>
          </div>
        ) : (
          <ExamForm 
            initialMeta={initialData.meta}
            initialQuestions={initialData.questions}
            onBack={() => navigate('/teacher')}
            onSave={handleSave}
            isEditMode={true}
          />
        )}
      </main>
    </div>
  );
}
