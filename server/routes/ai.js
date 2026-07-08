const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ai/generate-answers
router.post('/generate-answers', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { questions } = req.body;
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Danh sách câu hỏi không hợp lệ.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'Chưa cấu hình API Key của AI.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    // Lọc ra các câu hỏi cần điền đáp án
    const targetQuestions = questions.map((q) => {
      // Dọn dẹp HTML tag nếu có để giảm token
      const plainContent = q.contentIsHtml ? q.content.replace(/<[^>]*>?/gm, ' ') : q.content;
      return {
        id: q.id,
        type: q.type,
        content: plainContent.trim(),
        options: q.options || [],
      };
    });

    const CHUNK_SIZE = 40;
    let generatedAnswers = [];

    const generateForChunk = async (chunk, retryCount = 0) => {
      const prompt = `Bạn là một chuyên gia giáo dục. Nhiệm vụ của bạn là giải đề thi/câu hỏi được cung cấp và sinh ra đáp án đúng.
Dưới đây là một mảng JSON chứa danh sách các câu hỏi.
Đối với câu trắc nghiệm (MULTIPLE_CHOICE), hãy xác định chỉ mục (index từ 0 đến 3) của đáp án đúng trong mảng options.
Đối với câu tự luận (ESSAY), hãy viết một hướng dẫn/gợi ý chấm bài ngắn gọn (tối đa 150 chữ).

DANH SÁCH CÂU HỎI:
${JSON.stringify(chunk, null, 2)}

Hãy trả về một mảng JSON chứa các object có định dạng sau:
[
  {
    "id": "<id_cua_cau_hoi>",
    "correctAnswer": "<chỉ_mục_dạng_string_từ_0_đến_3_nếu_là_trắc_nghiệm>",
    "explanation": "<gợi_ý_chấm_bài_nếu_là_tự_luận>"
  }
]
Chỉ trả về chuỗi JSON hợp lệ, không kèm văn bản nào khác.`;

      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('AI không trả về định dạng JSON mảng hợp lệ');
        }
        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        const errorMsg = err.message || String(err);
        if (retryCount < 3 && (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Too Many Requests'))) {
          console.log(`[AI Retry] Rate limit hit (429). Waiting 65s... (${retryCount + 1}/3)`);
          await new Promise(r => setTimeout(r, 65000));
          return generateForChunk(chunk, retryCount + 1);
        }
        if (retryCount < 3 && (errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('fetch'))) {
          console.log(`[AI Retry] Chunk failed (503), retrying (${retryCount + 1}/3)...`);
          await new Promise(r => setTimeout(r, 3000));
          return generateForChunk(chunk, retryCount + 1);
        }
        throw err;
      }
    };

    for (let i = 0; i < targetQuestions.length; i += CHUNK_SIZE) {
      if (i > 0) {
        // Nghỉ 3 giây giữa các batch để tránh dính spam limit 15 req/min của Google
        await new Promise(r => setTimeout(r, 3000));
      }
      const chunk = targetQuestions.slice(i, i + CHUNK_SIZE);
      const chunkAnswers = await generateForChunk(chunk);
      generatedAnswers.push(...chunkAnswers);
    }

    res.json({ generatedAnswers });
  } catch (error) {
    console.error('[AI Generate Answers] Error:', error);
    require('fs').writeFileSync('ai_error.log', String(error) + '\\n' + error.stack);
    res.status(500).json({ message: 'Lỗi khi gọi AI sinh đáp án: ' + error.message });
  }
});

module.exports = router;
