const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { gradeEssayWithAI } = require('../utils/aiGrader');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/submissions/start — start an exam attempt
router.post('/start', authMiddleware, requireRole('STUDENT', 'ADMIN'), async (req, res) => {
  try {
    const { examId } = req.body;
    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { questions: { orderBy: { order: 'asc' } } } });
    if (!exam || !exam.isPublished) return res.status(404).json({ message: 'Bài kiểm tra không tồn tại' });
    if (exam.grade !== req.user.grade && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Bài kiểm tra không dành cho khối lớp của bạn' });

    // Check time window
    const now = new Date();
    if (exam.startAt && now < exam.startAt) return res.status(403).json({ message: 'Bài kiểm tra chưa bắt đầu' });
    if (exam.endAt && now > exam.endAt) return res.status(403).json({ message: 'Bài kiểm tra đã kết thúc' });

    // Check max attempts
    if (exam.maxAttempts) {
      const count = await prisma.submission.count({ where: { examId, userId: req.user.id, status: 'SUBMITTED' } });
      if (count >= exam.maxAttempts) return res.status(403).json({ message: `Bạn đã hết ${exam.maxAttempts} lượt làm bài` });
    }

    const attempt = await prisma.submission.count({ where: { examId, userId: req.user.id } }) + 1;
    const submission = await prisma.submission.create({
      data: { examId, userId: req.user.id, attempt, ipAddress: req.ip, userAgent: req.headers['user-agent'] }
    });

    // Shuffle questions if configured
    let questions = [...exam.questions];
    if (exam.shuffleQuestions) questions = questions.sort(() => Math.random() - 0.5);
    if (exam.shuffleOptions) {
      questions = questions.map(q => ({
        ...q,
        options: q.options ? [...q.options].sort(() => Math.random() - 0.5) : q.options
      }));
    }

    res.json({
      submission: { id: submission.id, startedAt: submission.startedAt, attempt },
      exam: { ...exam, questions: questions.map(q => ({ ...q, correctAnswer: undefined, explanation: undefined })) }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi bắt đầu bài kiểm tra' });
  }
});

// POST /api/submissions/:id/submit — submit answers
router.post('/:id/submit', authMiddleware, requireRole('STUDENT', 'ADMIN'), async (req, res) => {
  try {
    const { answers, timeSpentPerQuestion, cheatCount, cheatLogs } = req.body;
    // answers: { [questionId]: string | string[] }
    // timeSpentPerQuestion: { [questionId]: number } (seconds)

    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ message: 'Không tìm thấy bài làm' });
    if (submission.userId !== req.user.id) return res.status(403).json({ message: 'Không có quyền nộp bài này' });
    if (submission.status !== 'IN_PROGRESS') return res.status(400).json({ message: 'Bài đã được nộp' });

    const exam = await prisma.exam.findUnique({ where: { id: submission.examId }, include: { questions: true } });

    let totalScore = 0;
    let maxScore = 0;
    const answerRecords = [];
    const essayAnswers = [];

    for (const question of exam.questions) {
      maxScore += question.points;
      const studentAnswer = answers[question.id];
      const timeSpent = timeSpentPerQuestion?.[question.id] || 0;

      if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') {
        const correct = JSON.parse(JSON.stringify(question.correctAnswer || []));
        const studentArr = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer].filter(Boolean);
        const correctArr = Array.isArray(correct) ? correct : [correct];

        const isCorrect = studentArr.length > 0 &&
          studentArr.length === correctArr.length &&
          studentArr.every(a => correctArr.includes(a));

        const scoreEarned = isCorrect ? question.points : 0;
        totalScore += scoreEarned;

        answerRecords.push({
          submissionId: submission.id,
          questionId: question.id,
          answer: studentAnswer || null,
          isCorrect,
          scoreEarned,
          timeSpentSec: timeSpent,
        });
      } else if (question.type === 'ESSAY') {
        answerRecords.push({
          submissionId: submission.id,
          questionId: question.id,
          answer: studentAnswer || null,
          isCorrect: null,
          scoreEarned: null,
          timeSpentSec: timeSpent,
        });
        essayAnswers.push({ questionId: question.id, answer: studentAnswer, question });
      }
    }

    // Create all answers
    await prisma.submissionAnswer.createMany({ data: answerRecords });

    // Update submission
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const hasEssay = essayAnswers.length > 0;

    // Penalty for cheating
    const finalCheatCount = parseInt(cheatCount) || 0;
    if (!hasEssay && finalCheatCount >= 3 && percentage >= 50) {
      totalScore = totalScore / 2;
      percentage = percentage / 2;
    }

    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        submittedAt: new Date(),
        totalScore,
        maxScore,
        percentage,
        cheatCount: finalCheatCount,
        cheatLogs: Array.isArray(cheatLogs) ? cheatLogs : [],
        status: hasEssay ? 'SUBMITTED' : 'GRADED',
      }
    });

    // Create grading task for essay questions
    if (hasEssay) {
      await prisma.gradingTask.create({ data: { submissionId: submission.id } });
      // Run AI grading synchronously as requested by the user
      await gradeEssayWithAI(submission.id, essayAnswers);
    }

    // Re-fetch submission to get final score if AI graded it
    const finalSubmission = await prisma.submission.findUnique({
      where: { id: submission.id },
      include: { answers: true }
    });

    // Build result response
    const result = {
      submissionId: finalSubmission.id,
      totalScore: finalSubmission.totalScore,
      maxScore: finalSubmission.maxScore,
      percentage: Math.round(finalSubmission.percentage * 100) / 100,
      attempt: finalSubmission.attempt,
      hasEssay,
      status: finalSubmission.status,
    };

    if (exam.showAnswerAfter) {
      result.answers = exam.questions.map(q => ({
        questionId: q.id,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        studentAnswer: answers[q.id],
        isCorrect: finalSubmission.answers.find(a => a.questionId === q.id)?.isCorrect,
        scoreEarned: finalSubmission.answers.find(a => a.questionId === q.id)?.scoreEarned,
        timeSpentSec: timeSpentPerQuestion?.[q.id] || 0,
      }));
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi nộp bài' });
  }
});

// GET /api/submissions/history — student's submission history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { examId } = req.query;
    const where = { userId: req.user.id };
    if (examId) where.examId = examId;

    const submissions = await prisma.submission.findMany({
      where,
      include: { exam: { select: { title: true, subject: true, grade: true, timeLimit: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải lịch sử' });
  }
});

// GET /api/submissions/pending-grading — get list of submissions pending teacher grade
router.get('/pending-grading', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({ where: { createdById: req.user.id } });
    const examIds = exams.map(e => e.id);
    
    // Find all grading tasks that are pending or AI graded but not teacher graded
    const tasks = await prisma.gradingTask.findMany({
      where: {
        submission: { examId: { in: examIds } },
        status: { in: ['PENDING', 'AI_GRADED'] }
      },
      include: {
        submission: {
          include: {
            user: { select: { id: true, name: true, email: true, grade: true } },
            exam: { select: { title: true, subject: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi tải danh sách cần chấm' });
  }
});

// GET /api/submissions/:id — get submission detail with answers
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: {
        exam: { include: { questions: { orderBy: { order: 'asc' } } } },
        answers: { include: { question: true } },
      }
    });
    if (!submission) return res.status(404).json({ message: 'Không tìm thấy bài làm' });
    if (submission.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
      return res.status(403).json({ message: 'Không có quyền xem bài làm này' });
    }
    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải bài làm' });
  }
});

// PUT /api/submissions/:id/grade-essay — teacher manually grades essay
router.put('/:id/grade-essay', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { grades } = req.body;
    // grades: { [answerId]: { teacherScore, teacherRemark } }

    const updates = Object.entries(grades).map(([answerId, data]) =>
      prisma.submissionAnswer.update({
        where: { id: answerId },
        data: { teacherScore: data.teacherScore, teacherRemark: data.teacherRemark }
      })
    );
    await Promise.all(updates);

    // Recalculate total score
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { answers: { include: { question: true } } }
    });

    let totalScore = 0;
    for (const answer of submission.answers) {
      if (answer.question.type === 'ESSAY') {
        totalScore += answer.teacherScore ?? answer.aiScore ?? 0;
      } else {
        totalScore += answer.scoreEarned ?? 0;
      }
    }

    const updated = await prisma.submission.update({
      where: { id: req.params.id },
      data: { totalScore, percentage: (totalScore / submission.maxScore) * 100, status: 'GRADED' }
    });

    await prisma.gradingTask.updateMany({
      where: { submissionId: req.params.id },
      data: { status: 'TEACHER_GRADED', teacherId: req.user.id, gradedAt: new Date() }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi chấm bài' });
  }
});

module.exports = router;
