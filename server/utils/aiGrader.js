const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Grade essay answers using Gemini AI
 * @param {string} submissionId
 * @param {Array} essayAnswers - [{questionId, answer, question}]
 */
const gradeEssayWithAI = async (submissionId, essayAnswers) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[AI Grader] GEMINI_API_KEY not set, skipping AI grading');
    return;
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    for (const item of essayAnswers) {
      const { questionId, answer, question } = item;
      if (!answer || answer.trim() === '') {
        await prisma.submissionAnswer.updateMany({
          where: { submissionId, questionId },
          data: { aiScore: 0, aiRemark: 'Học sinh không trả lời', isCorrect: false, scoreEarned: 0 }
        });
        continue;
      }

      const referenceAnswer = question.correctAnswer ? JSON.stringify(question.correctAnswer) : 'Không có đáp án tham khảo';
      const prompt = `Bạn là giáo viên chấm bài kiểm tra. Hãy chấm câu trả lời tự luận sau và trả về kết quả dạng JSON.

CÂU HỎI: ${question.content}
ĐÁP ÁN THAM KHẢO: ${referenceAnswer}
ĐIỂM TỐI ĐA: ${question.points}
CÂU TRẢ LỜI CỦA HỌC SINH: ${answer}

Hãy đánh giá và trả về JSON với định dạng:
{
  "score": <điểm số từ 0 đến ${question.points}>,
  "remark": "<nhận xét chi tiết bằng tiếng Việt, tối đa 200 chữ>",
  "isCorrect": <true nếu score >= 70% điểm tối đa, false nếu không>
}

Chỉ trả về JSON, không có text thêm.`;

      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid JSON response');
        const grading = JSON.parse(jsonMatch[0]);

        const aiScore = Math.min(Math.max(parseFloat(grading.score) || 0, 0), question.points);
        await prisma.submissionAnswer.updateMany({
          where: { submissionId, questionId },
          data: {
            aiScore,
            aiRemark: grading.remark || '',
            isCorrect: grading.isCorrect || aiScore >= question.points * 0.7,
            scoreEarned: aiScore,
          }
        });
      } catch (aiError) {
        console.error(`[AI Grader] Failed for question ${questionId}:`, aiError.message);
        // Set default score if AI fails
        await prisma.submissionAnswer.updateMany({
          where: { submissionId, questionId },
          data: { aiScore: null, aiRemark: 'Không thể chấm tự động, cần giáo viên chấm.' }
        });
      }
    }

    // Recalculate submission total after AI grading
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { answers: { include: { question: true } } }
    });

    let totalScore = 0;
    for (const answer of submission.answers) {
      totalScore += answer.question.type === 'ESSAY'
        ? (answer.aiScore ?? 0)
        : (answer.scoreEarned ?? 0);
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: { totalScore, percentage: submission.maxScore > 0 ? (totalScore / submission.maxScore) * 100 : 0, status: 'GRADED' }
    });

    await prisma.gradingTask.updateMany({
      where: { submissionId },
      data: { status: 'AI_GRADED', gradedAt: new Date() }
    });

    console.log(`[AI Grader] Completed grading for submission ${submissionId}`);
  } catch (error) {
    console.error('[AI Grader] Error:', error.message);
  }
};

module.exports = { gradeEssayWithAI };
