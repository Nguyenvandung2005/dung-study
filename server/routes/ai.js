const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SCIENTIFIC_NOTATION_RULE = `- **QUY CHUẨN KÝ HIỆU KHOA HỌC & TOÁN HỌC (BẮT BUỘC TUÂN THỦ TRUYỆT ĐỐI)**:
  + TUYỆT ĐỐI KHÔNG viết chữ thay cho ký hiệu toán học, vật lý, hóa học.
  + Ví dụ về căn bậc hai: Phải viết ký hiệu chuẩn \`√(...)\` (như \`√(x - 2)\` hoặc \`√x\`), TUYỆT ĐỐI KHÔNG ĐƯỢC viết chữ "căn(x - 2)" hay "căn bậc hai".
  + Phân số, lũy thừa, số mũ, tích phân, đạo hàm, giới hạn, góc, độ... phải dùng đúng ký hiệu chuẩn (\`x²\`, \`x³\`, \`a/b\`, \`∫\`, \`lim\`, \`Σ\`, \`Δ\`, \`α\`, \`β\`, \`π\`, \`≤\`, \`≥\`, \`≠\`, \`±\`, \`∞\`, \`°C\`).
  + Công thức Hóa học phải viết đúng ký hiệu nguyên tố và chỉ số (ví dụ: \`H₂SO₄\`, \`CO₂\`, \`Fe²⁺\`, \`CH₃COOH\`).
  + Mọi câu hỏi và phương án đáp án A, B, C, D đều phải hiển thị đúng chuẩn ký hiệu bộ môn để học sinh đọc hiểu rõ ràng, chuẩn xác.`;

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
${SCIENTIFIC_NOTATION_RULE}

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
${SCIENTIFIC_NOTATION_RULE}
${mcqInstruction}
${essayInstruction}
${languageInstruction}
- Điểm mỗi câu trắc nghiệm: 1 điểm. Điểm mỗi câu tự luận: ${totalMcq > 0 ? Math.floor(10 / Math.max(totalEssay, 1)) : 10} điểm.
5. THÔNG TIN CHUNG: Trích xuất tên đề bài, môn, khối lớp, thời gian làm bài (nếu có).
6. TRẢ VỀ DUY NHẤT một Object JSON hợp lệ.

Format trả về:
{
  "metadata": {
    "title": "Tên bài thi",
    "subject": "Tên môn học",
    "grade": "Khối",
    "timeLimit": 90
  },
  "questions": [
    {
      "section": "Dạng (nếu có, ví dụ: 'Phần 1: Trắc nghiệm', 'Dạng 1: ...'). Nếu không chia phần thì để null.",
      "type": "MULTIPLE_CHOICE",
      "content": "Nội dung câu hỏi trắc nghiệm",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correctAnswer": "0",
      "points": 1,
      "explanation": "Giải thích ngắn gọn tại sao đáp án đúng"
    },
    {
      "section": "Tên Phần/Dạng tương tự hoặc null",
      "type": "ESSAY",
      "content": "Nội dung câu hỏi tự luận",
      "options": [],
      "correctAnswer": null,
      "points": 5,
      "explanation": "Gợi ý chấm bài và đáp án tham khảo"
    }
  ]
}
Chỉ trả về chuỗi JSON hợp lệ.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const text = result.response.text().trim();
    
    // Gemini with responseMimeType="application/json" returns the exact JSON string
    const parsed = JSON.parse(text);
    const rawQuestions = parsed.questions || parsed || [];
    const metadata = parsed.metadata || {};

    // Chuẩn hóa câu hỏi để khớp với ExamForm
    const questions = rawQuestions.map((q, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      section: q.section || '',
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

    console.log('AI RES METADATA:', metadata); res.json({ questions, metadata, total: questions.length });
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

// POST /api/ai/modify-exam — Chỉnh sửa & cải tiến đề thi theo câu lệnh AI
router.post('/modify-exam', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { instruction, questions, subject = '', grade = '' } = req.body;
    if (!instruction || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Vui lòng nhập yêu cầu chỉnh sửa và danh sách câu hỏi hiện tại.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'Chưa cấu hình GEMINI_API_KEY.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    const prompt = `Bạn là chuyên gia giáo dục và hội đồng thẩm định đề thi xuất sắc của Việt Nam.
Dưới đây là danh sách câu hỏi hiện tại của đề thi môn ${subject || 'chuyên môn'} (khối lớp ${grade || 'phổ thông'}):
${JSON.stringify(questions, null, 2)}

YÊU CẦU CHỈNH SỬA TỪ GIÁO VIÊN:
"${instruction}"

NHIỆM VỤ CỦA BẠN:
1. Hãy thực hiện chính xác yêu cầu chỉnh sửa trên đối với toàn bộ đề thi hoặc các câu hỏi liên quan.
2. Bạn có thể sửa nội dung câu hỏi, sửa phương án trả lời, cập nhật đáp án đúng, sửa giải thích, thêm/bớt độ khó, chuẩn hóa chính tả và ngữ pháp... theo đúng ý giáo viên.
${SCIENTIFIC_NOTATION_RULE}
3. TRẢ VỀ DUY NHẤT một mảng JSON chứa danh sách câu hỏi sau khi đã được chỉnh sửa hoàn chỉnh.

Format mỗi câu hỏi trong mảng JSON trả về:
[
  {
    "id": "<id câu hỏi gốc hoặc id mới>",
    "section": "<tên phần nếu có hoặc rỗng>",
    "type": "MULTIPLE_CHOICE",
    "content": "<nội dung câu hỏi sau khi sửa>",
    "options": ["A...", "B...", "C...", "D..."],
    "correctAnswer": "0",
    "points": 1,
    "explanation": "<lời giải thích sau khi sửa>"
  }
]
Chỉ trả về mảng JSON hợp lệ, không kèm văn bản markdown nào khác.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const text = result.response.text().trim();
    const parsed = JSON.parse(text);
    const rawQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

    const updatedQuestions = rawQuestions.map((q, idx) => {
      const orig = questions[idx] || {};
      return {
        id: q.id || orig.id || `ai-mod-${Date.now()}-${idx}`,
        section: q.section ?? orig.section ?? '',
        type: q.type === 'ESSAY' ? 'ESSAY' : 'MULTIPLE_CHOICE',
        content: q.content || orig.content || '',
        contentIsHtml: false,
        options: Array.isArray(q.options) && q.options.length >= 2
          ? q.options.map(o => (typeof o === 'string' ? o : String(o)))
          : (orig.options || ['', '', '', '']),
        correctAnswer: q.correctAnswer != null ? String(q.correctAnswer) : (orig.correctAnswer || '0'),
        points: Number(q.points) || Number(orig.points) || 1,
        explanation: q.explanation || orig.explanation || '',
        imageUrl: orig.imageUrl || '',
        svgFigure: orig.svgFigure || ''
      };
    });

    res.json({ questions: updatedQuestions, total: updatedQuestions.length });
  } catch (error) {
    console.error('[AI Modify Exam] Error:', error);
    res.status(500).json({ message: 'Lỗi khi AI chỉnh sửa đề thi: ' + error.message });
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
   - Nếu trong ảnh có khoanh tròn, gạch chân hoặc ghi đáp án đúng, hãy ghi nhận vào trường correctAnswer (chỉ số 0=A, 1=B, 2=C, 3=D).
   - Cung cấp lời giải thích ngắn gọn vào trường explanation.
3. Với câu hỏi Tự luận:
   - Trích xuất toàn bộ yêu cầu đề bài.
   - Đưa ra lời giải hoặc gợi ý chấm bài chi tiết vào trường explanation.
4. "imageBox": Nếu câu hỏi có hình minh họa, hãy xác định [ymin, xmin, ymax, xmax] (0.0-1.0), nếu không thì null.
${SCIENTIFIC_NOTATION_RULE}

Hãy trả về một Object JSON gồm metadata và questions:
{
  "metadata": { "title": "...", "subject": "...", "grade": "...", "timeLimit": 90 },
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "content": "Nội dung câu hỏi...",
      "options": ["Đáp án A...", "Đáp án B...", "Đáp án C...", "Đáp án D..."],
      "correctAnswer": "0",
      "points": 1,
      "explanation": "Giải thích đáp...",
      "imageBox": null,
      "pageIndex": 0
    }
  ]
}`;

    const parts = [
      { text: prompt },
      ...imgList.map(img => ({
        inlineData: {
          data: (img.data || img.base64 || '').replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, ''),
          mimeType: img.mimeType || 'image/jpeg'
        }
      }))
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json" }
    });
    
    let rawData = { questions: [], metadata: {} };
    try {
      rawData = JSON.parse(result.response.text().trim());
    } catch (e) {
      return res.status(500).json({ message: 'Lỗi parse JSON từ AI Vision' });
    }

    const questions = (rawData.questions || []).map((q, idx) => ({
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

// POST /api/ai/parse-document — AI đọc thông minh nội dung file Word/PDF
router.post('/parse-document', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { text, htmlContent, imagesBase64 = [], fileType = 'unknown' } = req.body;

    if (!text && !htmlContent) {
      return res.status(400).json({ message: 'Vui lòng cung cấp nội dung văn bản từ file.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'Chưa cấu hình GEMINI_API_KEY.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    // Dọn HTML → plain text để giảm token, nhưng vẫn giữ cấu trúc dòng
    const cleanText = (htmlContent || text)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .substring(0, 18000);

    const prompt = `Bạn là một chuyên gia giáo dục Việt Nam, am hiểu sâu về mọi định dạng đề thi.
Hãy đọc kỹ nội dung sau được trích xuất từ file đề thi (${fileType === 'word' ? 'Word .docx' : 'PDF'}).
${imagesBase64.length > 0 ? `Các hình đính kèm là hình vẽ/sơ đồ được nhúng trong tài liệu (có tổng cộng ${imagesBase64.length} hình, lần lượt có index 0, 1, 2...).` : 'Không có hình ảnh đính kèm.'}

NỘI DUNG FILE:
---
${cleanText}
---

YÊU CẦU PHÂN TÍCH (CỰC KỲ QUAN TRỌNG):
1. Bắt buộc nhận diện TẤT CẢ câu hỏi có trong file, CẢ PHẦN TRẮC NGHIỆM VÀ PHẦN TỰ LUẬN (ESSAY). Không được bỏ sót bất kỳ câu nào.
2. Câu trắc nghiệm (MULTIPLE_CHOICE): NẾU CÓ CÁC LỰA CHỌN A, B, C, D (hoặc tương tự) THÌ BẮT BUỘC PHẢI CHỌN LOẠI MULTIPLE_CHOICE. BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC GỘP CÁC LỰA CHỌN NÀY VÀO TRONG PHẦN "content". Phải tách rời thành mảng "options" với độ dài chính xác 4.
3. Câu tự luận (ESSAY): Chỉ dùng khi hoàn toàn không có lựa chọn A/B/C/D. Hãy trích xuất toàn bộ yêu cầu đề bài.
4. "hasFigure" và "figureImageIndex": Nếu câu hỏi có đề cập đến hình vẽ, đồ thị, sơ đồ (ví dụ: "hình bên", "sơ đồ sau"), BẮT BUỘC gán "hasFigure": true. Nếu mảng ảnh đính kèm > 0, hãy chỉ định "figureImageIndex" tương ứng (0, 1, 2...). Nếu không có ảnh, để -1.
5. "section": TRÍCH XUẤT TIÊU ĐỀ PHẦN. Nếu trước câu hỏi có các tiêu đề nhóm/phần (ví dụ: "PHẦN I: TRẮC NGHIỆM", "DẠNG 1: PHÁT ÂM...", "II. Tự luận"), hãy gán vào trường "section". Tiêu đề này sẽ áp dụng cho tất cả các câu hỏi thuộc phần đó cho đến khi gặp phần mới.
6. THÔNG TIN ĐỀ THI (METADATA): Trích xuất tên đề bài, môn học, khối lớp, thời gian làm bài (nếu có) từ phần đầu trang.
${SCIENTIFIC_NOTATION_RULE}
7. Trả về DUY NHẤT một Object JSON hợp lệ.

Format trả về:
{
  "metadata": {
    "title": "Tên bài kiểm tra (ví dụ: Đề thi THPT Quốc gia môn Toán)",
    "subject": "Tên môn học (ví dụ: Toán, Ngữ văn, Tiếng Anh...)",
    "grade": "Khối lớp (số từ 1-12, ví dụ: 12)",
    "timeLimit": 90
  },
  "questions": [
    {
      "section": "DẠNG 1: PHÁT ÂM... (hoặc null nếu không có)",
    "type": "MULTIPLE_CHOICE",
    "content": "Nội dung câu hỏi đầy đủ (KHÔNG BAO GỒM A,B,C,D)",
    "options": ["Nội dung A", "Nội dung B", "Nội dung C", "Nội dung D"],
    "correctAnswer": "0",
    "points": 1,
    "explanation": "Giải thích",
    "hasFigure": true,
    "figureImageIndex": 0
  },
  {
    "section": "PHẦN II: TỰ LUẬN",
    "type": "ESSAY",
    "content": "Nội dung câu tự luận",
    "options": [],
    "correctAnswer": "",
    "points": 2,
    "explanation": "Gợi ý chấm bài",
    "hasFigure": false,
    "figureImageIndex": -1
  }
  ]
}`;

    const parts = [{ text: prompt }];
    // Đính kèm ảnh nhúng từ file Word (tối đa 5 ảnh)
    for (let i = 0; i < imagesBase64.length && i < 5; i++) {
      const img = imagesBase64[i];
      const cleanData = (img.data || '').replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
      if (cleanData.length > 100) {
        parts.push({ inlineData: { data: cleanData, mimeType: img.mimeType || 'image/png' } });
      }
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const responseText = result.response.text().trim();
    
    let rawQuestions = [];
    let metadata = {};
    try {
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) {
        rawQuestions = parsed;
      } else {
        rawQuestions = parsed.questions || [];
        metadata = parsed.metadata || {};
      }
    } catch (e) {
      return res.status(500).json({ message: 'AI không phân tích được cấu trúc file. Vui lòng thử lại hoặc dùng chế độ thường.' });
    }

    const questions = rawQuestions.map((q, idx) => ({
      id: `ai-doc-${Date.now()}-${idx}`,
      section: q.section || '',
      type: q.type === 'ESSAY' ? 'ESSAY' : 'MULTIPLE_CHOICE',
      content: q.content || '',
      contentIsHtml: false,
      options: Array.isArray(q.options) && q.options.length >= 2
        ? q.options.map(o => (typeof o === 'string' ? o : String(o)))
        : ['', '', '', ''],
      correctAnswer: q.correctAnswer != null ? String(q.correctAnswer) : '',
      points: Number(q.points) || (q.type === 'ESSAY' ? 2 : 1),
      explanation: q.explanation || '',
      hasFigure: !!q.hasFigure,
      figureImageIndex: Number(q.figureImageIndex ?? -1),
    }));

    res.json({ questions, metadata, total: questions.length });
  } catch (error) {
    console.error('[AI Parse Document] Error:', error);
    res.status(500).json({ message: 'Lỗi khi AI phân tích tài liệu: ' + error.message });
  }
});

// POST /api/ai/figure-to-svg — AI tái hiện hình vẽ toán học thành SVG từ ảnh gốc
router.post('/figure-to-svg', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', questionContent = '' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: 'Vui lòng cung cấp hình ảnh hình vẽ cần chuyển đổi.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'Chưa cấu hình GEMINI_API_KEY.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    const prompt = `Bạn là một chuyên gia đồ họa toán học và SVG. Phân tích hình vẽ trong ảnh và tái hiện CHÍNH XÁC hình vẽ đó dưới dạng SVG vector sạch.

${questionContent ? `Ngữ cảnh câu hỏi: "${questionContent.substring(0, 300)}"` : ''}

YÊU CẦU BẮT BUỘC:
1. Tái hiện CHÍNH XÁC những gì có trong ảnh — KHÔNG sáng tạo, KHÔNG thêm bớt.
2. Giữ nguyên tất cả nhãn, ký hiệu, chữ số, chữ cái (A, B, C, O, x, y, α, β...) đúng vị trí như trong ảnh gốc.
3. Giữ nguyên tỷ lệ hình học (góc, kích thước tương đối, hướng mũi tên...).
4. SVG phải: viewBox="0 0 400 300", background trong suốt, màu đường nét #2d3748 (tối), font-family="serif" cho ký hiệu toán.
5. Nếu có hệ trục tọa độ: vẽ trục x, y với mũi tên và nhãn, các điểm/đường cong đúng theo ảnh.
6. Nếu hình học phẳng: vẽ đường thẳng, góc, cung tròn đúng như ảnh.
7. Thêm title SVG mô tả ngắn gọn hình vẽ.

Chỉ trả về mã SVG hợp lệ, bắt đầu bằng <svg và kết thúc bằng </svg>. KHÔNG thêm markdown hay văn bản nào khác.`;

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
    const cleanMime = mimeType.replace(/^data:/, '').split(';')[0] || 'image/png';

    const parts = [
      prompt,
      { inlineData: { data: cleanBase64, mimeType: cleanMime } }
    ];

    const result = await model.generateContent(parts);
    const responseText = result.response.text().trim();

    // Trích xuất SVG từ response
    let svgMatch = responseText.match(/<svg[\s\S]*?<\/svg>/i);
    // Fallback: tìm trong code block markdown
    if (!svgMatch) {
      const codeBlock = responseText.match(/```(?:svg|xml)?\s*([\s\S]*?)```/i);
      if (codeBlock) svgMatch = codeBlock[1].match(/<svg[\s\S]*?<\/svg>/i);
    }

    if (!svgMatch) {
      return res.status(500).json({ message: 'AI không thể tạo SVG từ hình vẽ này. Ảnh có thể quá mờ hoặc không phải hình toán học.' });
    }

    res.json({ svgCode: svgMatch[0] });
  } catch (error) {
    console.error('[AI Figure to SVG] Error:', error);
    res.status(500).json({ message: 'Lỗi khi AI vẽ hình SVG: ' + error.message });
  }
});

module.exports = router;


