const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/statistics/global — Global statistics for Teacher/Admin
router.get('/global', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { subject } = req.query;
    const whereExam = req.user.role === 'ADMIN' ? {} : { createdById: req.user.id };
    if (subject) {
      whereExam.subject = subject;
    }
    const exams = await prisma.exam.findMany({ where: whereExam, select: { id: true, subject: true } });
    const examIds = exams.map(e => e.id);

    if (examIds.length === 0) {
      return res.json({ totalExams: 0, totalSubmissions: 0, avgScore: 0, totalCheating: 0, trendData: [], subjectData: [], scoreDistribution: [], subjectPerformance: [], recentSubmissions: [] });
    }

    const submissions = await prisma.submission.findMany({
      where: { examId: { in: examIds }, status: 'GRADED' },
      include: { 
        exam: { select: { subject: true, title: true } },
        user: { select: { name: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    const totalSubmissions = submissions.length;
    const avgScore = totalSubmissions > 0 ? submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / totalSubmissions : 0;
    const totalCheating = submissions.reduce((sum, s) => sum + (s.cheatCount > 0 ? 1 : 0), 0);

    // Subject Distribution (PieChart)
    const subjectCount = exams.reduce((acc, curr) => {
      acc[curr.subject] = (acc[curr.subject] || 0) + 1;
      return acc;
    }, {});
    const subjectData = Object.keys(subjectCount).map(name => ({ name, value: subjectCount[name] }));

    // Trend Data (AreaChart) - Last 7 days
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendMap[d.toISOString().split('T')[0]] = 0;
    }
    submissions.forEach(s => {
      if (s.submittedAt) {
        const dateStr = s.submittedAt.toISOString().split('T')[0];
        if (trendMap[dateStr] !== undefined) trendMap[dateStr]++;
      }
    });
    const trendData = Object.keys(trendMap).map(date => ({ name: date.slice(5).replace('-', '/'), Lượt_nộp: trendMap[date] }));

    // Score Distribution (BarChart)
    const scoreDist = Array(10).fill(0);
    submissions.forEach(s => {
      if (s.percentage !== null) {
        const index = Math.min(Math.floor(s.percentage / 10), 9);
        scoreDist[index]++;
      }
    });
    const scoreDistribution = scoreDist.map((count, i) => ({ name: `${i * 10}-${i * 10 + 9}`, Học_sinh: count }));

    // Subject Performance (RadarChart)
    const subjPerfMap = {
      'Toán': { sum: 0, count: 0 },
      'Văn': { sum: 0, count: 0 },
      'Anh': { sum: 0, count: 0 },
      'Lý': { sum: 0, count: 0 },
      'Hóa': { sum: 0, count: 0 }
    };
    submissions.forEach(s => {
      const subj = s.exam.subject || 'Khác';
      if (!subjPerfMap[subj]) subjPerfMap[subj] = { sum: 0, count: 0 };
      subjPerfMap[subj].sum += (s.percentage || 0);
      subjPerfMap[subj].count++;
    });
    const subjectPerformance = Object.keys(subjPerfMap).map(subj => ({
      subject: subj,
      Điểm_TB: subjPerfMap[subj].count > 0 ? parseFloat((subjPerfMap[subj].sum / subjPerfMap[subj].count).toFixed(1)) : 0
    }));

    // Recent Submissions (Table)
    const recentSubmissions = submissions.slice(0, 8).map(s => ({
      id: s.id,
      student: s.user.name,
      exam: s.exam.title,
      score: s.percentage,
      date: s.submittedAt
    }));

    res.json({
      totalExams: exams.length,
      totalSubmissions,
      avgScore: avgScore.toFixed(1),
      totalCheating,
      trendData,
      subjectData,
      scoreDistribution,
      subjectPerformance,
      recentSubmissions
    });
  } catch (error) {
    console.error('[Global Stats API Error]', error);
    res.status(500).json({ message: 'Lỗi khi tải thống kê tổng quan.' });
  }
});

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
        cheatCount: s.cheatCount || 0,
        answers: s.answers,
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

// GET /api/statistics/leaderboard — Bảng xếp hạng Top học sinh
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    // Lấy tất cả submission đã chấm, gom nhóm theo user
    const submissions = await prisma.submission.findMany({
      where: { status: 'GRADED', percentage: { not: null } },
      include: { user: { select: { id: true, name: true, grade: true, email: true } } },
    });

    // Gom nhóm theo userId
    const userMap = {};
    for (const sub of submissions) {
      if (!sub.user) continue;
      const uid = sub.user.id;
      if (!userMap[uid]) {
        userMap[uid] = { user: sub.user, totalScore: 0, count: 0 };
      }
      userMap[uid].totalScore += sub.percentage || 0;
      userMap[uid].count += 1;
    }

    // Tính trung bình và sắp xếp
    const leaderboard = Object.values(userMap)
      .map((entry) => ({
        userId: entry.user.id,
        name: entry.user.name,
        grade: entry.user.grade,
        examCount: entry.count,
        avgScore: Math.round((entry.totalScore / entry.count) * 10) / 10,
      }))
      .sort((a, b) => b.avgScore - a.avgScore || b.examCount - a.examCount)
      .slice(0, limit)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    res.json({ leaderboard, total: leaderboard.length });
  } catch (error) {
    console.error('[Leaderboard]', error);
    res.status(500).json({ message: 'Lỗi khi tải bảng xếp hạng.' });
  }
});

module.exports = router;
