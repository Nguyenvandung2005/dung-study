const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/statistics/exam/:examId — full exam statistics for teacher
router.get('/exam/:examId', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.examId },
      include: { questions: { orderBy: { order: 'asc' } } }
    });
    if (!exam) return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra' });
    if (exam.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Không có quyền xem thống kê' });
    }

    const submissions = await prisma.submission.findMany({
      where: { examId: req.params.examId, status: { in: ['SUBMITTED', 'GRADED'] } },
      include: {
        user: { select: { id: true, name: true, email: true, grade: true } },
        answers: true,
      },
      orderBy: { submittedAt: 'desc' }
    });

    if (submissions.length === 0) {
      return res.json({ exam, submissions: [], stats: null });
    }

    // Overall statistics
    const scores = submissions.map(s => s.percentage || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const passCount = scores.filter(s => s >= 50).length;

    // Score distribution (0-10 buckets)
    const distribution = Array(10).fill(0);
    scores.forEach(s => {
      const bucket = Math.min(Math.floor(s / 10), 9);
      distribution[bucket]++;
    });

    // Per-question analysis
    const questionStats = exam.questions.map(question => {
      const questionAnswers = submissions.flatMap(s =>
        s.answers.filter(a => a.questionId === question.id)
      );

      const answered = questionAnswers.filter(a => a.answer !== null).length;
      const correct = questionAnswers.filter(a => a.isCorrect === true).length;
      const avgTime = questionAnswers.length > 0
        ? questionAnswers.reduce((sum, a) => sum + (a.timeSpentSec || 0), 0) / questionAnswers.length
        : 0;

      // Detect suspicious behavior: average time < 2 seconds
      const suspiciousCount = questionAnswers.filter(a => a.timeSpentSec < 2 && a.answer !== null).length;

      // Option distribution for MCQ
      let optionDistribution = null;
      if (question.type !== 'ESSAY' && question.options) {
        optionDistribution = {};
        question.options.forEach(opt => { optionDistribution[opt.id] = 0; });
        questionAnswers.forEach(a => {
          const selected = Array.isArray(a.answer) ? a.answer : [a.answer].filter(Boolean);
          selected.forEach(optId => {
            if (optionDistribution[optId] !== undefined) optionDistribution[optId]++;
          });
        });
      }

      return {
        questionId: question.id,
        content: question.content,
        type: question.type,
        order: question.order,
        totalAnswered: answered,
        correctCount: correct,
        correctRate: answered > 0 ? (correct / answered) * 100 : 0,
        avgTimeSpentSec: Math.round(avgTime * 10) / 10,
        suspiciousCount,
        optionDistribution,
      };
    });

    // Duration analysis
    const durations = submissions
      .filter(s => s.startedAt && s.submittedAt)
      .map(s => (new Date(s.submittedAt) - new Date(s.startedAt)) / 1000 / 60); // minutes

    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    res.json({
      exam,
      submissions: submissions.map(s => ({
        id: s.id,
        user: s.user,
        attempt: s.attempt,
        totalScore: s.totalScore,
        maxScore: s.maxScore,
        percentage: s.percentage,
        startedAt: s.startedAt,
        submittedAt: s.submittedAt,
        duration: s.startedAt && s.submittedAt
          ? Math.round((new Date(s.submittedAt) - new Date(s.startedAt)) / 1000 / 60 * 10) / 10
          : null,
        status: s.status,
      })),
      stats: {
        totalSubmissions: submissions.length,
        uniqueStudents: new Set(submissions.map(s => s.userId)).size,
        avgScore: Math.round(avgScore * 100) / 100,
        maxScore: Math.round(maxScore * 100) / 100,
        minScore: Math.round(minScore * 100) / 100,
        passRate: Math.round((passCount / submissions.length) * 100 * 100) / 100,
        avgDuration: Math.round(avgDuration * 10) / 10,
        distribution,
        questionStats,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi tải thống kê' });
  }
});

// GET /api/statistics/teacher — teacher's overview
router.get('/teacher', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const teacherId = req.user.id;
    const exams = await prisma.exam.findMany({ where: { createdById: teacherId } });
    const examIds = exams.map(e => e.id);
    const totalSubmissions = await prisma.submission.count({ where: { examId: { in: examIds } } });
    const pendingGrading = await prisma.gradingTask.count({ where: { submissionId: { in: (await prisma.submission.findMany({ where: { examId: { in: examIds } } })).map(s => s.id) }, status: { in: ['PENDING', 'AI_GRADED'] } } });

    res.json({
      totalExams: exams.length,
      publishedExams: exams.filter(e => e.isPublished).length,
      totalSubmissions,
      pendingGrading,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải thống kê giáo viên' });
  }
});

module.exports = router;
