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


// POST /api/ai/analyze-student-result
router.post('/analyze-student-result', authMiddleware, requireRole('STUDENT', 'TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { subject, grade, score, maxScore, wrongQuestions } = req.body;
    if (!subject || score === undefined) {
      return res.status(400).json({ message: 'Thiếu thông tin bài thi để phân tích.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'Chưa cấu hình API Key của AI.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    const wrongSummary = wrongQuestions && wrongQuestions.length > 0
      ? wrongQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
      : 'Không có thông tin chi tiết về câu sai.';

    const prompt = `Bạn là một giáo viên tận tâm của Việt Nam, chuyên môn về ${subject} dành cho học sinh lớp ${grade || 'phổ thông'}.

Học sinh vừa hoàn thành bài kiểm tra với kết quả:
- Điểm số: ${score}/${maxScore || 10}
- Môn học: ${subject}

Các câu hỏi học sinh trả lời sai hoặc thiếu:
${wrongSummary}

Dựa vào kết quả trên, hãy viết một đoạn nhận xét và gợi ý ôn tập cá nhân hóa cho học sinh bằng tiếng Việt, bao gồm:
1. Nhận xét tổng quát về kết quả (2-3 câu, khích lệ và tích cực)
2. Xác định điểm yếu kiến thức cần ôn tập (nêu cụ thể chương/dạng bài)
3. Gợi ý 3-4 phương pháp ôn tập cụ thể và thực tiễn
4. Lời động viên kết thúc (1-2 câu)

Hãy viết theo văn phong thân thiện, gần gũi với học sinh. Tổng độ dài khoảng 150-200 từ.`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text().trim();

    res.json({ analysis });
  } catch (error) {
    console.error('[AI Analyze Result] Error:', error);
    res.status(500).json({ message: 'Lỗi khi gọi AI phân tích kết quả: ' + error.message });
  }
});

// POST /api/ai/generate-exam — Soạn đề thi tự động bằng AI
router.post('/generate-exam', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { topic, grade, subject, mcqCount = 5, essayCount = 1, difficulty = '', overallDifficulty = 'Trung bình' } = req.body;
    if (!topic || !grade || !subject) {
      return res.status(400).json({ message: 'Vui lòng cung cấp chủ đề, khối lớp và môn học.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'Chưa cấu hình GEMINI_API_KEY.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    const totalMcq = Math.min(Math.max(Number(mcqCount) || 0, 0), 100);
    const totalEssay = Math.min(Math.max(Number(essayCount) || 0, 0), 20);

    const difficultyPrompt = difficulty 
      ? `\n- Phân bổ chi tiết độ khó (BẮT BUỘC tuân thủ): ${difficulty}` 
      : '';

    let mcqInstruction = totalMcq > 0 
      ? `- ${totalMcq} câu hỏi TRẮC NGHIỆM (type: "MULTIPLE_CHOICE"), mỗi câu có đúng 4 lựa chọn A/B/C/D và đáp án đúng.` 
      : `- KHÔNG TẠO câu hỏi trắc nghiệm nào.`;

    let essayInstruction = totalEssay > 0 
      ? `- ${totalEssay} câu hỏi TỰ LUẬN (type: "ESSAY"), mỗi câu có gợi ý chấm bài chi tiết.` 
      : `- KHÔNG TẠO câu hỏi tự luận nào.`;

    let literatureInstruction = '';
    if ((subject.toLowerCase().includes('văn') || subject.toLowerCase().includes('ngữ văn')) && totalEssay > 0) {
      literatureInstruction = `\n- LƯU Ý ĐẶC BIỆT MÔN NGỮ VĂN: Cấu trúc đề phải chuẩn theo định dạng thi Tốt nghiệp THPT Quốc gia. Phần ĐỌC HIỂU phải cung cấp rõ MỘT ĐOẠN TRÍCH (VĂN BẢN/THƠ) cụ thể trong nội dung câu hỏi đầu tiên, sau đó các câu hỏi tiếp theo sẽ hỏi dựa trên văn bản đó. TUYỆT ĐỐI không hỏi chung chung thiếu văn bản gốc.`;
    }

    let languageInstruction = `- Nội dung câu hỏi phải chính xác, bám sát chương trình phổ thông lớp ${grade}, bằng tiếng Việt.`;
    if (subject.toLowerCase().includes('anh') || subject.toLowerCase().includes('english')) {
      languageInstruction = `- LƯU Ý ĐẶC BIỆT MÔN TIẾNG ANH: Toàn bộ nội dung câu hỏi, yêu cầu đề bài và các đáp án phải được viết hoàn toàn bằng TIẾNG ANH (ngoại trừ các dạng bài tập yêu cầu dịch sang tiếng Việt).`;
    }

    const prompt = `Bạn là một chuyên gia giáo dục và hội đồng ra đề thi xuất sắc của Việt Nam, am hiểu sâu sắc quy chuẩn ra đề của **Sở Giáo dục và Đào tạo tỉnh Nghệ An**.
Hãy soạn một đề kiểm tra môn **${subject}** dành cho **Lớp ${grade}** với chủ đề: **${topic}**.

YÊU CẦU CHUYÊN MÔN VÀ CẤU TRÚC ĐỀ THI (CHUẨN SỞ GD&ĐT TỈNH NGHỆ AN):
- **Bám sát cấu trúc thi của Sở GD&ĐT Nghệ An**: Câu hỏi phải tuân thủ đúng định hướng ra đề kiểm tra định kỳ / khảo sát chất lượng hiện hành của Sở GD&ĐT tỉnh Nghệ An theo Chương trình GDPT 2018.
- **Phân hóa 4 mức độ tư duy chuẩn xác**: Nhận biết – Thông hiểu – Vận dụng – Vận dụng cao, đảm bảo phân loại tốt năng lực học sinh theo tiêu chuẩn đánh giá của Nghệ An.
- **Ngữ liệu & thực tiễn ưu tiên yếu tố địa phương Nghệ An**: Với các bài toán ứng dụng thực tế hoặc môn Ngữ văn, Lịch sử, Địa lý, GDCD..., khuyến khích lồng ghép khéo léo ngữ liệu văn hóa, lịch sử, địa lý thực tiễn của tỉnh Nghệ An (như Sông Lam, Núi Quyết, Quê Bác Kim Liên - Nam Đàn, Thành Vinh, Khu kinh tế Đông Nam Nghệ An...) để đề thi vừa chuẩn mực vừa gần gũi thực tế.
- Mức độ chung của đề thi: **${overallDifficulty}**.
- Văn phong ra đề: Nghiêm túc, khúc chiết, chuẩn mực theo phong cách đề thi chính thức của Sở GD&ĐT Nghệ An.${difficultyPrompt}${literatureInstruction}
${mcqInstruction}
${essayInstruction}
${languageInstruction}
- Điểm mỗi câu trắc nghiệm: 1 điểm. Điểm mỗi câu tự luận: ${totalMcq > 0 ? Math.floor(10 / Math.max(totalEssay, 1)) : 10} điểm.

Hãy trả về một mảng JSON theo đúng cấu trúc sau (không kèm văn bản nào khác):
[
  {
    "type": "MULTIPLE_CHOICE",
    "content": "Nội dung câu hỏi trắc nghiệm",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correctAnswer": "0",
    "points": 1,
    "explanation": "Giải thích ngắn gọn tại sao đáp án đúng"
  },
  {
    "type": "ESSAY",
    "content": "Nội dung câu hỏi tự luận",
    "options": [],
    "correctAnswer": null,
    "points": 5,
    "explanation": "Gợi ý chấm bài và đáp án tham khảo"
  }
]
Chỉ trả về chuỗi JSON hợp lệ.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'AI không trả về định dạng JSON hợp lệ. Thử lại nhé!' });
    }

    const rawQuestions = JSON.parse(jsonMatch[0]);

    // Chuẩn hóa câu hỏi để khớp với ExamForm
    const questions = rawQuestions.map((q, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      type: q.type === 'ESSAY' ? 'ESSAY' : 'MULTIPLE_CHOICE',
      content: q.content || '',
      contentIsHtml: false,
      options: Array.isArray(q.options) && q.options.length >= 2
        ? q.options.map((o) => (typeof o === 'string' ? o : String(o)))
        : ['', '', '', ''],
      correctAnswer: q.correctAnswer != null ? String(q.correctAnswer) : '',
      points: Number(q.points) || (q.type === 'ESSAY' ? 5 : 1),
      explanation: q.explanation || '',
    }));

    res.json({ questions, total: questions.length });
  } catch (error) {
    console.error('[AI Generate Exam] Error:', error);
    const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');
    res.status(isRateLimit ? 429 : 500).json({
      message: isRateLimit
        ? 'Quá nhiều yêu cầu AI, vui lòng chờ 1 phút rồi thử lại.'
        : 'Lỗi khi AI soạn đề: ' + error.message,
    });
  }
});

// POST /api/ai/scan-exam-image — Quét ảnh đề thi OCR bằng AI Vision
router.post('/scan-exam-image', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {

  try {
    const { images, base64Image, mimeType = 'image/jpeg' } = req.body;
    const imgList = Array.isArray(images) && images.length > 0
      ? images
      : base64Image ? [{ data: base64Image.replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, ''), mimeType }] : [];

    if (imgList.length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất 1 ảnh đề thi cần quét.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'Chưa cấu hình GEMINI_API_KEY.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    const prompt = `Bạn là một chuyên gia AI nhận dạng ký tự quang học (OCR) và sư phạm xuất sắc của Việt Nam.
Hãy đọc thật kỹ hình ảnh đề thi/bài kiểm tra được cung cấp, nhận diện và trích xuất TẤT CẢ các câu hỏi có trong ảnh một cách CHÍNH XÁC NHẤT.

YÊU CẦU QUAN TRỌNG:
1. Nhận diện cả câu hỏi TRẮC NGHIỆM (MULTIPLE_CHOICE) và câu hỏi TỰ LUẬN (ESSAY).
2. Với câu hỏi Trắc nghiệm:
   - Trích xuất trọn vẹn nội dung câu hỏi.
   - Trích xuất đủ các lựa chọn A, B, C, D vào mảng options.
   - Nếu trong ảnh có khoanh tròn, gạch chân hoặc ghi đáp án đúng, hãy ghi nhận vào trường correctAnswer (chỉ số 0=A, 1=B, 2=C, 3=D). Nếu không rõ đáp án đúng, hãy tự xác định đáp án chính xác nhất.
   - Cung cấp lời giải thích ngắn gọn vào trường explanation.
3. Với câu hỏi Tự luận:
   - Trích xuất toàn bộ yêu cầu đề bài.
   - Đưa ra lời giải hoặc gợi ý chấm bài chi tiết vào trường explanation.
4. Giữ nguyên công thức toán học hoặc ký hiệu một cách chính xác, rõ ràng.
5. QUAN TRỌNG NHẤT VỀ HÌNH ẢNH MINH HỌA (AUTO CROP):
   - Nếu câu hỏi có hình vẽ, sơ đồ, bảng biểu hoặc hình ảnh minh họa (ví dụ 4 biển báo giao thông ở Câu 12):
   - Hãy xác định vị trí hộp tọa độ (bounding box) của hình ảnh đó trên trang đề thi theo tỷ lệ từ 0.0 đến 1.0 (ví dụ ymin: 0.60, xmin: 0.05, ymax: 0.82, xmax: 0.95).
   - Trả về trường "imageBox": [ymin, xmin, ymax, xmax] và "pageIndex": 0 (số trang ảnh 0, 1, ...). Nếu câu hỏi không có hình minh họa thì đặt "imageBox": null.

Hãy trả về một chuỗi JSON mảng chuẩn xác (không kèm văn bản nào khác ngoài JSON):
[
  {
    "type": "MULTIPLE_CHOICE",
    "content": "Nội dung câu hỏi...",
    "options": ["Đáp án A...", "Đáp án B...", "Đáp án C...", "Đáp án D..."],
    "correctAnswer": "0",
    "points": 1,
    "explanation": "Giải thích đáp án...",
    "imageBox": [0.60, 0.05, 0.85, 0.95],
    "pageIndex": 0
  },
  {
    "type": "ESSAY",
    "content": "Nội dung câu tự luận...",
    "options": [],
    "correctAnswer": null,
    "points": 2,
    "explanation": "Gợi ý chấm bài / Lời giải...",
    "imageBox": null,
    "pageIndex": 0
  }
]
Chỉ trả về JSON hợp lệ.`;

    const parts = [
      prompt,
      ...imgList.map(img => ({
        inlineData: {
          data: (img.data || img.base64 || '').replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, ''),
          mimeType: img.mimeType || 'image/jpeg'
        }
      }))
    ];

    const result = await model.generateContent(parts);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'AI không nhận diện được danh sách câu hỏi. Hãy đảm bảo ảnh chụp rõ nét và đủ ánh sáng.' });
    }

    const rawQuestions = JSON.parse(jsonMatch[0]);

    const questions = rawQuestions.map((q, idx) => ({
      id: `ocr-${Date.now()}-${idx}`,
      type: q.type === 'ESSAY' ? 'ESSAY' : 'MULTIPLE_CHOICE',
      content: q.content || '',
      contentIsHtml: false,
      options: Array.isArray(q.options) && q.options.length >= 2
        ? q.options.map((o) => (typeof o === 'string' ? o : String(o)))
        : ['', '', '', ''],
      correctAnswer: q.correctAnswer != null ? String(q.correctAnswer) : '0',
      points: Number(q.points) || (q.type === 'ESSAY' ? 2 : 1),
      explanation: q.explanation || '',
      imageBox: Array.isArray(q.imageBox) && q.imageBox.length === 4 ? q.imageBox : null,
      pageIndex: Number(q.pageIndex) || 0,
    }));

    res.json({ questions, total: questions.length });
  } catch (error) {
    console.error('[AI OCR Scan] Error:', error);
    res.status(500).json({ message: 'Lỗi khi quét ảnh OCR: ' + error.message });
  }
});

module.exports = router;

