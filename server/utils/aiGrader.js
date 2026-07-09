const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

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
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' }); // Sử dụng model khả dụng

    for (const item of essayAnswers) {
      const { questionId, answer, question } = item;
      if (!answer || answer.trim() === '') {
        await prisma.submissionAnswer.updateMany({
          where: { submissionId, questionId },
          data: { aiScore: 0, aiRemark: 'Học sinh không trả lời', isCorrect: false, scoreEarned: 0 }
        });
        continue;
      }

      // Check if answer contains image attachment
      const imgMatch = answer.match(/\[Ảnh bài làm:\s*\/uploads\/answers\/(.*?)\]/);
      let imagePart = null;
      let cleanedAnswerText = answer.replace(/\[Ảnh bài làm:\s*.*?\]/, '').trim();

      if (imgMatch) {
        const fileName = imgMatch[1];
        const filePath = path.join(__dirname, '../uploads/answers', fileName);
        if (fs.existsSync(filePath)) {
          const ext = path.extname(fileName).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          try {
            imagePart = fileToGenerativePart(filePath, mimeType);
          } catch (err) {
            console.error('[AI Grader] Error loading image for AI grading:', err);
          }
        }
      }

      const referenceAnswer = question.correctAnswer ? JSON.stringify(question.correctAnswer) : 'Không có đáp án tham khảo';
      const prompt = `Bạn là giáo viên chấm bài kiểm tra tự luận. Hãy chấm câu trả lời tự luận của học sinh và trả về kết quả dạng JSON.

CÂU HỎI: ${question.content}
ĐÁP ÁN THAM KHẢO: ${referenceAnswer}
ĐIỂM TỐI ĐA: ${question.points}

${imagePart ? 'HỌC SINH CÓ ĐÍNH KÈM ẢNH BÀI LÀM VIẾT TAY (được gửi kèm tin nhắn này). Hãy xem, phân tích hình ảnh và chữ viết tay trong ảnh này để chấm điểm.' : ''}
CÂU TRẢ LỜI BẰNG CHỮ (NẾU CÓ): ${cleanedAnswerText || '(Không có câu trả lời bằng chữ)'}

Hãy đánh giá và trả về JSON với định dạng:
{
  "score": <điểm số từ 0 đến ${question.points}, có thể lẻ đến 0.25 hoặc 0.5>,
  "remark": "<nhận xét chi tiết bằng tiếng Việt về chữ viết tay và nội dung bài làm, chỉ ra ưu điểm và nhược điểm, tối đa 200 chữ>",
  "isCorrect": <true nếu score >= 70% điểm tối đa, false nếu không>
}

Chỉ trả về JSON, không có text thêm.`;

      try {
        const contents = imagePart ? [prompt, imagePart] : [prompt];
        const result = await model.generateContent(contents);
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

    let percentage = submission.maxScore > 0 ? (totalScore / submission.maxScore) * 100 : 0;

    // Phạt chia đôi điểm nếu gian lận từ 3 lần trở lên và điểm bài làm >= 50%
    if (submission.cheatCount >= 3 && percentage >= 50) {
      totalScore = totalScore / 2;
      percentage = percentage / 2;
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: { totalScore, percentage, status: 'GRADED' }
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
