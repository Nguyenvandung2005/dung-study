const express = require('express');
const { formatErrorMessage } = require('../utils/errorHandler');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, requireRole, optionalAuth } = require('../middleware/auth');
const adminEventHub = require('../utils/adminEventHub');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/exams — list exams (student: all published exams, teacher: their exams, admin: all)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    await prisma.exam.updateMany({
      where: {
        isPublished: false,
        startAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gt: now } }]
      },
      data: { isPublished: true }
    });

    const { user } = req;
    let where = {};
    if (user.role === 'STUDENT') {
      where = { isPublished: true };
    } else if (user.role === 'TEACHER') {
      where = { createdById: user.id };
    }
    const exams = await prisma.exam.findMany({
      where,
      include: { createdBy: { select: { name: true } }, _count: { select: { questions: true, submissions: { where: { status: { in: ['SUBMITTED', 'GRADED'] } } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(exams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'Lỗi khi tải danh sách bài kiểm tra') });
  }
});

// GET /api/exams/:id — get exam detail
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    await prisma.exam.updateMany({
      where: {
        id: req.params.id,
        isPublished: false,
        startAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gt: now } }]
      },
      data: { isPublished: true }
    });

    const { user } = req;
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { name: true } },
        questions: { orderBy: { order: 'asc' } }
      }
    });
    if (!exam) return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra' });
    // Students can only see published exams
    if (user.role === 'STUDENT') {
      if (!exam.isPublished) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập bài kiểm tra này' });
      }
      // Hide correct answers during exam
      const sanitized = {
        ...exam,
        questions: exam.questions.map(q => ({ ...q, correctAnswer: undefined, explanation: undefined }))
      };
      return res.json(sanitized);
    }
    res.json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'Lỗi khi tải bài kiểm tra') });
  }
});

// POST /api/exams — create exam (teacher/admin)
router.post('/', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { title, description, subject, grade, timeLimit, shuffleQuestions, shuffleOptions, showAnswerAfter, maxAttempts, startAt, endAt, questions } = req.body;
    if (!title || !subject || !grade || !timeLimit) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    const exam = await prisma.exam.create({
      data: {
        title, description, subject,
        grade: parseInt(grade),
        timeLimit: parseInt(timeLimit),
        shuffleQuestions: shuffleQuestions ?? false,
        shuffleOptions: shuffleOptions ?? false,
        showAnswerAfter: showAnswerAfter ?? true,
        maxAttempts: maxAttempts ? parseInt(maxAttempts) : null,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
        createdById: req.user.id,
        questions: questions?.length > 0 ? {
          create: questions.map((q, idx) => {
            // Map frontend types to Prisma QuestionType enum
            let type = q.type;
            if (type === 'MULTIPLE_CHOICE' || type === 'MULTIPLE_CORRECT') type = 'SINGLE_CHOICE';
            if (!['SINGLE_CHOICE', 'ESSAY'].includes(type)) type = 'SINGLE_CHOICE';

            // Convert options array of strings to [{id, text}] for MCQ
            let options = q.options || null;
            if (type === 'SINGLE_CHOICE' && Array.isArray(options) && typeof options[0] === 'string') {
              options = options.map((text, i) => ({ id: String.fromCharCode(65 + i), text }));
            }

            // correctAnswer: frontend sends index '0','1','2','3' — convert to letter 'A','B','C','D'
            let correctAnswer = q.correctAnswer || null;
            if (type === 'SINGLE_CHOICE' && correctAnswer !== null) {
              const idx = parseInt(correctAnswer);
              if (!isNaN(idx)) correctAnswer = [String.fromCharCode(65 + idx)];
              else if (typeof correctAnswer === 'string' && correctAnswer.length === 1) correctAnswer = [correctAnswer.toUpperCase()];
            }

              return {
                content: q.content,
                section: q.section || null,
                type,
                options: type === 'ESSAY' ? null : options,
                correctAnswer: type === 'ESSAY' ? null : correctAnswer,
                explanation: q.explanation || null,
                points: parseFloat(q.points) || 1,
                order: q.order ?? idx + 1,
                imageUrl: q.imageUrl || null,
              };
          })
        } : undefined
      },
      include: { questions: true }
    });

    adminEventHub.broadcastEvent({
      type: 'EXAM_CREATED',
      title: 'Đề kiểm tra mới được tạo! 📝',
      message: `${req.user.name} vừa tạo đề kiểm tra mới: "${exam.title}" (${exam.subject} - Lớp ${exam.grade}).`,
      data: { examId: exam.id, title: exam.title },
      actionSuggestion: {
        label: '📝 Xem đề kiểm tra vừa tạo',
        actionType: 'NAVIGATE',
        target: '/admin/exams'
      }
    });

    res.status(201).json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'Lỗi khi tạo bài kiểm tra') });
  }
});

// PUT /api/exams/:id — update exam
router.put('/:id', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra' });
    if (exam.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa' });
    }
    const { questions, ...examData } = req.body;
    const updated = await prisma.exam.update({
      where: { id: req.params.id },
      data: {
        ...examData,
        grade: examData.grade ? parseInt(examData.grade) : undefined,
        timeLimit: examData.timeLimit ? parseInt(examData.timeLimit) : undefined,
        startAt: examData.startAt ? new Date(examData.startAt) : null,
        endAt: examData.endAt ? new Date(examData.endAt) : null,
      }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'Lỗi khi cập nhật bài kiểm tra') });
  }
});

// DELETE /api/exams/:id
router.delete('/:id', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra' });
    if (exam.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Không có quyền xóa' });
    }
    await prisma.exam.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa bài kiểm tra' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'Lỗi khi xóa bài kiểm tra') });
  }
});

// PATCH /api/exams/:id/publish
router.patch('/:id/publish', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { isPublished } = req.body;
    const updateData = { isPublished };

    if (!isPublished) {
      const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
      const now = new Date();
      if (exam && exam.startAt && exam.startAt <= now) {
        if (!exam.endAt || exam.endAt > now) {
          updateData.endAt = now;
        }
      }
    } else {
      // Khi CỐ TÌNH BẬT thủ công, nếu bài thi đang có endAt trong quá khứ (bị đóng trước đó) -> XÓA endAt để mở lại vô thời hạn
      const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
      const now = new Date();
      if (exam && exam.endAt && exam.endAt <= now) {
        updateData.endAt = null;
      }
    }

    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'Lỗi khi cập nhật trạng thái') });
  }
});

// POST /api/exams/:id/questions — add/replace questions
router.post('/:id/questions', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { questions, replaceAll } = req.body;
    if (replaceAll) {
      await prisma.question.deleteMany({ where: { examId: req.params.id } });
    }
    const mappedQuestions = questions.map((q, idx) => {
      let type = q.type;
      if (type === 'MULTIPLE_CHOICE' || type === 'MULTIPLE_CORRECT') type = 'SINGLE_CHOICE';
      if (!['SINGLE_CHOICE', 'ESSAY'].includes(type)) type = 'SINGLE_CHOICE';

      let options = q.options || null;
      if (type === 'SINGLE_CHOICE' && Array.isArray(options) && typeof options[0] === 'string') {
        options = options.map((text, i) => ({ id: String.fromCharCode(65 + i), text }));
      }

      let correctAnswer = q.correctAnswer || null;
      if (type === 'SINGLE_CHOICE' && correctAnswer !== null) {
        const idInt = parseInt(correctAnswer);
        if (!isNaN(idInt)) correctAnswer = [String.fromCharCode(65 + idInt)];
        else if (typeof correctAnswer === 'string' && correctAnswer.length === 1) correctAnswer = [correctAnswer.toUpperCase()];
      }

      return {
        examId: req.params.id,
        content: q.content,
        section: q.section || null,
        type,
        options: type === 'ESSAY' ? null : options,
        correctAnswer: type === 'ESSAY' ? null : correctAnswer,
        explanation: q.explanation || null,
        points: parseFloat(q.points) || 1,
        order: q.order ?? idx + 1,
        imageUrl: q.imageUrl || null,
      };
    });

    const created = await prisma.question.createMany({
      data: mappedQuestions
    });
    res.json({ message: `Đã thêm ${created.count} câu hỏi`, count: created.count });
  } catch (error) {
    console.error(error);
    require('fs').writeFileSync('error.log', String(error) + '\\n' + JSON.stringify(error, Object.getOwnPropertyNames(error)) + '\\n' + error.stack);
    res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'Lỗi khi thêm câu hỏi') });
  }
});

module.exports = router;
