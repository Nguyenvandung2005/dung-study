const express = require('express');
const { formatErrorMessage } = require('../utils/errorHandler');
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
      const prompt = `Bạn là một chuyên gia giáo dục. Nhiệm vụ của bạn là giải đề thi/câu hỏi được cung cấp và sinh ra đáp án cực kỳ chi tiết, chuẩn xác, kèm ba-rem (parem) chấm điểm.
Dưới đây là một mảng JSON chứa danh sách các câu hỏi.
1. Đối với câu trắc nghiệm (MULTIPLE_CHOICE), hãy xác định chỉ mục (index từ 0 đến 3) của đáp án đúng trong mảng options.
2. Đối với câu tự luận hoặc viết văn (ESSAY):
   - Bạn BẮT BUỘC phải viết một ba-rem chấm điểm chi tiết dưới dạng BẢNG (Markdown table). Bảng phải chia rõ từng ý/phần và mức điểm tương ứng.
   - Ví dụ:
     | Phần/Ý | Nội dung yêu cầu | Điểm |
     |---|---|---|
     | 1 | Mở bài... | 1.0 |
   - Nếu bài giải cần vẽ hình minh họa, BẮT BUỘC quy định điểm cho phần vẽ hình trong bảng, VÀ tạo một mã <svg> hợp lệ cho hình đó.
${SCIENTIFIC_NOTATION_RULE}

DANH SÁCH CÂU HỎI:
${JSON.stringify(chunk, null, 2)}

Hãy trả về một mảng JSON chứa các object có định dạng sau:
[
  {
    "id": "<id_cua_cau_hoi>",
    "correctAnswer": "<chỉ_mục_dạng_string_từ_0_đến_3_nếu_là_trắc_nghiệm>",
    "explanation": "<Lưu ý: Nếu là tự luận, hãy điền BẢNG BA-REM điểm và đáp án cực kỳ chi tiết vào đây>",
    "svgFigure": "<Chỉ tạo mã <svg> nếu câu trả lời yêu cầu phải vẽ hình minh họa, ngược lại để rỗng>"
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
    res.status(500).json({ message: formatErrorMessage(error, 'Lỗi khi gọi AI sinh đáp án: ') });
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
    res.status(500).json({ message: formatErrorMessage(error, 'Lỗi khi gọi AI phân tích kết quả: ') });
  }
});

// Hàm chuẩn hóa câu hỏi từ AI (tách SVG khỏi content, xử lý ảnh minh họa)
function normalizeAIQuestionContent(q, orig = {}, idx = 0) {
  let content = q.content || orig.content || '';
  let svgFigure = q.svgFigure || orig.svgFigure || '';

  const svgRegex = /<svg[\s\S]*?<\/svg>/i;
  const match = content.match(svgRegex);
  if (match) {
    if (!svgFigure) {
      svgFigure = match[0];
    }
    content = content
      .replace(/\[SVG Figure:\s*<svg[\s\S]*?<\/svg>\s*\]/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
      .trim();
  }

  return {
    id: q.id || orig.id || `ai-${Date.now()}-${idx}`,
    section: q.section ?? orig.section ?? '',
    type: (q.type === 'ESSAY' || orig.type === 'ESSAY') ? 'ESSAY' : 'MULTIPLE_CHOICE',
    content: content,
    contentIsHtml: false,
    options: Array.isArray(q.options) && q.options.length >= 2
      ? q.options.map((o) => (typeof o === 'string' ? o : String(o)))
      : (orig.options || ['', '', '', '']),
    correctAnswer: q.correctAnswer != null ? String(q.correctAnswer) : (orig.correctAnswer || '0'),
    points: Number(q.points) || Number(orig.points) || ((q.type === 'ESSAY' || orig.type === 'ESSAY') ? 5 : 1),
    explanation: q.explanation || orig.explanation || '',
    imageUrl: q.imageUrl || orig.imageUrl || '',
    svgFigure: svgFigure
  };
}

// Hàm parse JSON an toàn tuyệt đối từ phản hồi AI (lọc bỏ ký tự thừa, markdown fence phía sau)
function safeParseAIJSON(rawText) {
  if (!rawText) return {};
  let text = rawText.trim();

  // 1. Loại bỏ markdown codeblock ```json ... ``` hoặc ``` ... ```
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 2. Thử parse trực tiếp
  try {
    return JSON.parse(text);
  } catch (err1) {
    // 3. Tìm khối {...} hoặc [...] hợp lệ lớn nhất
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');

    // 4. JSON bị cắt đứt giữa chừng (truncated) — quét ngược từ cuối để tìm điểm hợp lệ
    // Xác định ký tự mở đầu và loại cấu trúc
    const startIdx = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)
      ? firstBrace : firstBracket;
    const closingChar = (startIdx === firstBrace) ? '}' : ']';

    if (startIdx !== -1) {
      // Quét ngược: thử cắt tại mỗi vị trí của closing char từ cuối lên
      let searchFrom = text.length;
      while (true) {
        const pos = text.lastIndexOf(closingChar, searchFrom - 1);
        if (pos <= startIdx) break;
        try {
          const candidate = text.substring(startIdx, pos + 1);
          const parsed = JSON.parse(candidate);
          console.warn(`[safeParseAIJSON] JSON bị cắt, đã phục hồi tại vị trí ${pos}/${text.length}`);
          return parsed;
        } catch (e) {
          searchFrom = pos;
        }
      }
    }

    throw err1;
  }
}

// ─── Quy chuẩn SVG chuyên biệt cho hình minh họa toán học ───────────────────
const SVG_FIGURE_SPEC = `Quy tắc vẽ SVG hình minh họa toán học (BẮT BUỘC tuân thủ để hình đẹp, rõ ràng và chính xác):
1. viewBox="0 0 400 300" width="400" height="300" - Kích thước chuẩn, không nhỏ hơn.
2. Nền trắng: <rect width="400" height="300" fill="white"/>
3. Hệ trục tọa độ (nếu là đồ thị hàm số / đường thẳng / elip / parabol / hình học giải tích):
   - Trục Ox: <line x1="20" y1="150" x2="380" y2="150" stroke="black" stroke-width="1.5"/>
   - Trục Oy: <line x1="200" y1="280" x2="200" y2="20" stroke="black" stroke-width="1.5"/>
   - Mũi tên trục: thêm <polygon> ở đầu mỗi trục
   - Nhãn trục: <text> 'x' và 'y' ở đầu mỗi trục, font-size="14"
   - Đánh số trên trục: mỗi 50px đánh 1 số (ví dụ: -3, -2, -1, 1, 2, 3), font-size="11"
   - Vạch chia: <line> ngắn 4px ngang và dọc tại mỗi giá trị
   - Điểm gốc O: <text x="195" y="165" font-size="11">O</text>
4. Đường đồ thị: stroke-width="2", màu sắc rõ nét (#1d4ed8 cho parabol/đường cong, #dc2626 cho đường thẳng)
5. Hình hình học (tam giác, hình thoi, hình thang...):
   - Dùng <polygon> hoặc <path>, fill="none" stroke="#1e40af" stroke-width="2"
   - Đánh nhãn các đỉnh (A, B, C...) bằng <text> font-size="13" font-weight="bold"
   - Đánh số liệu cạnh, góc bằng <text> ngay cạnh cạnh tương ứng
   - Vẽ ký hiệu góc vuông bằng hình vuông nhỏ 8x8px nếu có góc 90°
6. Ghi chú quan trọng:
   - Mọi số liệu đề bài nhắc đến (độ dài cạnh, tọa độ điểm, hệ số a/b/c...) PHẢI hiển thị trong hình
   - Dùng <text> với font-family="serif" hoặc font-family="Arial" cho ký hiệu toán học
   - Tọa độ điểm đặc biệt: đánh dấu bằng <circle r="3" fill="black"/> và ghi tọa độ (x; y) bên cạnh`;

// Phát hiện câu hỏi cần hình minh họa dựa trên nội dung
function questionNeedsFigure(content = '') {
  const lower = content.toLowerCase();
  return /(cho hình|hình dưới đây|hình bên|theo hình|nhìn hình|hình vẽ|hình \d|hình [a-z]|quan sát hình|trên hình|đồ thị hàm|đồ thị dưới|hình học|tam giác|hình vuông|hình chữ nhật|hình thang|hình thoi|hình lục giác|hình tròn|đường tròn|parabol|ellipse|elip|double-click|biểu đồ|sơ đồ|vẽ hình)/i.test(content);
}

// Sinh SVG chất lượng cao cho từng câu hỏi cần hình — gọi sau khi đã có danh sách câu hỏi
async function generateSVGsForQuestions(questions, subject, grade, genAI) {
  // Lọc câu cần vẽ hình nhưng chưa có SVG
  const needFigure = questions.reduce((acc, q, idx) => {
    if (!q.svgFigure && questionNeedsFigure(q.content)) acc.push(idx);
    return acc;
  }, []);

  if (needFigure.length === 0) return questions;

  const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

  // Vẽ từng hình song song (tối đa 8 câu cùng lúc để tránh rate-limit)
  const BATCH = 8;
  for (let i = 0; i < needFigure.length; i += BATCH) {
    const batch = needFigure.slice(i, i + BATCH);
    await Promise.all(batch.map(async (qIdx) => {
      const q = questions[qIdx];
      try {
        const svgPrompt = `Bạn là chuyên gia đồ họa toán học. Nhiệm vụ: Vẽ hình minh họa SVG chính xác, đẹp, chi tiết cho câu hỏi thi môn ${subject || 'Toán'} lớp ${grade || '12'} sau đây.

NỘI DUNG CÂU HỎI:
"${q.content}"

${SVG_FIGURE_SPEC}

Quy tắc trả về:
- Chỉ trả về DUY NHẤT mã SVG hợp lệ hoàn chỉnh, bắt đầu bằng <svg và kết thúc bằng </svg>
- KHÔNG thêm bất kỳ văn bản, giải thích hay markdown nào khác
- Hình phải phản ánh ĐÚNG số liệu, tọa độ, kích thước được đề cập trong câu hỏi`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: svgPrompt }] }],
          generationConfig: { maxOutputTokens: 4096 }
        });
        const svgText = result.response.text().trim();
        // Trích xuất chỉ phần <svg>...</svg>
        const match = svgText.match(/<svg[\s\S]*?<\/svg>/i);
        if (match) {
          questions[qIdx] = { ...q, svgFigure: match[0] };
        }
      } catch (e) {
        console.warn(`[SVG Gen] Câu ${qIdx + 1}: Bỏ qua lỗi -`, e.message);
      }
    }));
  }

  return questions;
}

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
      ? `- ${totalEssay} câu hỏi TỰ LUẬN (type: "ESSAY"). ĐỐI VỚI CÂU TỰ LUẬN: Yêu cầu bắt buộc phải viết ba-rem chấm điểm cực kỳ chi tiết dưới dạng BẢNG (Markdown table) trong trường "explanation". Bảng phải chia rõ từng ý/phần, phân bổ điểm cộng trừ cho từng ý, và nếu yêu cầu vẽ hình minh họa thì phải ghi rõ điểm cho phần vẽ hình.`
      : `- KHÔNG TẠO câu hỏi tự luận nào.`;

    let literatureInstruction = '';
    if ((subject.toLowerCase().includes('văn') || subject.toLowerCase().includes('ngữ văn')) && totalEssay > 0) {
      literatureInstruction = `\n- LƯU Ý ĐẶC BIỆT MÔN NGỮ VĂN: Cấu trúc đề phải chuẩn theo định dạng thi Tốt nghiệp THPT Quốc gia. Phần ĐỌC HIỂU phải cung cấp rõ MỘT ĐOẠN TRÍCH (VĂN BẢN/THƠ) cụ thể trong nội dung câu hỏi đầu tiên, sau đó các câu hỏi tiếp theo sẽ hỏi dựa trên văn bản đó. TUYỆT ĐỐI không hỏi chung chung thiếu văn bản gốc.`;
    }

    let languageInstruction = `- Nội dung câu hỏi phải chính xác, bám sát chương trình phổ thông lớp ${grade}, bằng tiếng Việt.`;
    if (subject.toLowerCase().includes('anh') || subject.toLowerCase().includes('english')) {
      languageInstruction = `- LƯU Ý ĐẶC BIỆT MÔN TIẾNG ANH: Toàn bộ nội dung câu hỏi, yêu cầu đề bài và các đáp án phải được viết hoàn toàn bằng TIẾNG ANH (ngoại trừ các dạng bài tập yêu cầu dịch sang tiếng Việt).`;
    }

    const totalQuestions = totalMcq + totalEssay;

    // Phát hiện xem giáo viên có yêu cầu vẽ hình minh họa không
    const wantsFigures = difficulty && /(hình|minh họa|đồ thị|svg|vẽ|hình học|tọa độ|biểu đồ)/i.test(difficulty);

    const customRequestPrompt = difficulty
      ? `\n- YÊU CẦU ĐẶC BIỆT TỪ GIÁO VIÊN (BẮT BUỘC TUÂN THỦ TRỌN VẸN): "${difficulty}"`
      : '';

    // Nếu cần hình: thêm hướng dẫn để AI đánh dấu câu nào cần SVG (sẽ vẽ ở bước sau)
    const figureGuidance = wantsFigures
      ? `\n⚠️ YÊU CẦU HÌNH MINH HỌA: Với các câu hỏi hình học, đồ thị, tọa độ hoặc câu có đề cập "cho hình dưới đây":
  - PHẢI đặt trường "svgFigure": "NEEDS_FIGURE" để đánh dấu câu cần vẽ hình
  - Trong "content" của câu hỏi đó, PHẢI ghi rõ "(Xem hình minh họa bên dưới)"
  - Ghi đầy đủ số liệu: tọa độ điểm, độ dài cạnh, hệ số hàm số... trong nội dung câu hỏi để hệ thống vẽ hình chính xác`
      : '';

    const prompt = `Bạn là một chuyên gia giáo dục và hội đồng ra đề thi xuất sắc của Việt Nam, am hiểu sâu sắc quy chuẩn ra đề của **Sở Giáo dục và Đào tạo tỉnh Nghệ An**.
Hãy soạn một đề kiểm tra môn **${subject}** dành cho **Lớp ${grade}** với chủ đề: **${topic}**.

⚠️ QUY ĐỊNH BẮT BUỘC VỀ SỐ LƯỢNG CÂU HỎI (CỰC KỲ QUAN TRỌNG):
- Bạn PHẢI TẠO ĐÚNG VÀ ĐỦ ${totalMcq} câu hỏi TRẮC NGHIỆM và ${totalEssay} câu hỏi TỰ LUẬN.
- Tổng số câu hỏi trong mảng "questions" BẮT BUỘC PHẢI CHÍNH XÁC LÀ ${totalQuestions} câu. TUYỆT ĐỐI KHÔNG TẠO THIẾU DÙ CHỈ 1 CÂU! KHÔNG VIẾT TẮT HAY DỪNG GIỮA CHỪNG!${figureGuidance}

YÊU CẦU CHUYÊN MÔN VÀ CẤU TRÚC ĐỀ THI (CHUẨN SỞ GD&ĐT TỈNH NGHỆ AN):
- **Bám sát cấu trúc thi của Sở GD&ĐT Nghệ An**: Câu hỏi phải tuân thủ đúng định hướng ra đề kiểm tra định kỳ / khảo sát chất lượng hiện hành của Sở GD&ĐT tỉnh Nghệ An theo Chương trình GDPT 2018.
- **Phân hóa 4 mức độ tư duy chuẩn xác**: Nhận biết – Thông hiểu – Vận dụng – Vận dụng cao.
- **Ngữ liệu & thực tiễn ưu tiên yếu tố địa phương Nghệ An**: Khuyến khích lồng ghép ngữ liệu thực tiễn của tỉnh Nghệ An.
- Mức độ chung của đề thi: **${overallDifficulty}**.
- QUY ĐỊNH VỀ HÌNH VẼ MINH HỌA (SVG): TUYỆT ĐỐI KHÔNG ghi mã <svg...> hoặc [SVG Figure: ...] vào trong nội dung câu hỏi (trường "content"). Nếu câu hỏi cần hình minh họa (đồ thị, hình học...), hãy viết mã <svg...> hợp lệ vào trường riêng "svgFigure".${customRequestPrompt}${literatureInstruction}
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
      "section": "Dạng (nếu có, ví dụ: 'Phần 1: Trắc nghiệm'). Nếu không chia phần thì để null.",
      "type": "MULTIPLE_CHOICE",
      "content": "Nội dung câu hỏi trắc nghiệm sạch (tuyệt đối không chứa mã svg)",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correctAnswer": "0",
      "points": 1,
      "explanation": "Giải thích ngắn gọn tại sao đáp án đúng",
      "svgFigure": "<mã <svg...> hợp lệ nếu câu hỏi cần hình minh họa, nếu không thì để rỗng>"
    }
  ]
}
Chỉ trả về chuỗi JSON hợp lệ.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 65536
      }
    });
    const text = result.response.text().trim();

    // Parse JSON an toàn kể cả khi AI trả kèm ký tự thừa hay markdown block
    const parsed = safeParseAIJSON(text);
    const rawQuestions = parsed.questions || parsed || [];
    const metadata = parsed.metadata || {};

    // Chuẩn hóa câu hỏi và tách SVG nếu cần
    let questions = rawQuestions.map((q, idx) => {
      // Nếu AI đánh dấu NEEDS_FIGURE thì reset về rỗng để generateSVGsForQuestions vẽ
      if (q.svgFigure === 'NEEDS_FIGURE') q.svgFigure = '';
      return normalizeAIQuestionContent(q, {}, idx);
    });

    // Bước 2: Vẽ SVG chất lượng cao cho các câu cần hình (nếu giáo viên yêu cầu hoặc câu tự phát hiện)
    if (wantsFigures || questions.some(q => questionNeedsFigure(q.content) && !q.svgFigure)) {
      console.log('[SVG Pipeline] Đang vẽ hình minh họa cho các câu hỏi cần hình...');
      questions = await generateSVGsForQuestions(questions, subject, grade, genAI);
    }

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

    // ─── Phát hiện yêu cầu "tạo thêm N câu" ─────────────────────────────────
    // Regex lấy số lượng câu cần thêm từ câu lệnh (vd: "tạo thêm 44 câu", "thêm 10 câu trắc nghiệm")
    const addMoreMatch = instruction.match(
      /(?:tạo\s+thêm|thêm|bổ\s+sung|thêm\s+vào)\s+(\d+)\s*(?:câu|câu\s+hỏi)/i
    );

    if (addMoreMatch) {
      // ─── Nhánh A: Sinh thêm câu hỏi bằng cách gọi riêng API generate ────────
      const extraCount = Math.min(parseInt(addMoreMatch[1], 10), 200);

      // Đề thi hiện tại được dùng làm context, không phải output — giảm tải mô hình
      const existingTopics = questions
        .slice(0, 5)
        .map((q, i) => `Câu ${i + 1}: ${q.content || ''}`.substring(0, 150))
        .join('\n');

      const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

      // Xác định loại câu hỏi dựa trên instruction
      const isEssay = /tự\s*luận/i.test(instruction);
      const extraMcq = isEssay ? 0 : extraCount;
      const extraEssay = isEssay ? extraCount : 0;

      const customAddRequest = instruction.replace(addMoreMatch[0], '').trim() || '';

      const addPrompt = `Bạn là chuyên gia giáo dục, hội đồng ra đề thi của Sở GD&ĐT tỉnh Nghệ An.
Đề thi hiện tại môn **${subject || 'chuyên môn'}** (Lớp ${grade || 'phổ thông'}) đang có ${questions.length} câu.
Một số câu hỏi hiện tại để tham khảo phong cách:
${existingTopics}

⚠️ NHIỆM VỤ: Tạo thêm ĐÚNG VÀ ĐỦ ${extraCount} câu hỏi MỚI HOÀN TOÀN (không trùng nội dung với các câu đã có).
${extraMcq > 0 ? `- Tạo đúng ${extraMcq} câu TRẮC NGHIỆM (type: "MULTIPLE_CHOICE"), mỗi câu có 4 đáp án A/B/C/D.` : ''}
${extraEssay > 0 ? `- Tạo đúng ${extraEssay} câu TỰ LUẬN (type: "ESSAY").` : ''}
${customAddRequest ? `- YÊU CẦU THÊM: ${customAddRequest}` : ''}
- TUYỆT ĐỐI PHẢI TẠO ĐỦ ${extraCount} CÂU. KHÔNG ĐƯỢC THIẾU DÙ 1 CÂU!
${SCIENTIFIC_NOTATION_RULE}

Trả về mảng JSON đúng định dạng sau (chỉ ${extraCount} câu hỏi mới):
[
  {
    "id": "",
    "section": "",
    "type": "MULTIPLE_CHOICE",
    "content": "<nội dung câu hỏi sạch>",
    "options": ["A...", "B...", "C...", "D..."],
    "correctAnswer": "0",
    "points": 1,
    "explanation": "<giải thích>",
    "svgFigure": ""
  }
]
Chỉ trả về mảng JSON hợp lệ.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: addPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 65536
        }
      });

      const text = result.response.text().trim();
      const parsed = safeParseAIJSON(text);
      const newRaw = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      const newQuestions = newRaw.map((q, idx) => normalizeAIQuestionContent(q, {}, questions.length + idx));

      // Merge: giữ nguyên toàn bộ câu gốc + thêm câu mới vào cuối
      const merged = [...questions, ...newQuestions];
      return res.json({ questions: merged, total: merged.length, added: newQuestions.length });
    }

    // ─── Nhánh B: Chỉnh sửa bình thường (không tạo thêm) ─────────────────────
    // Nếu đề thi quá lớn (>30 câu), chỉ gửi phần tóm tắt + ID câu gốc để tiết kiệm token
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    // Với đề lớn: gửi tóm gọn từng câu thay vì toàn bộ JSON đầy đủ
    const questionsPayload = questions.length > 30
      ? questions.map((q, i) => ({
        idx: i,
        id: q.id || `q_${i}`,
        type: q.type,
        content: (q.content || '').substring(0, 300),
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points
      }))
      : questions;

    const prompt = `Bạn là chuyên gia giáo dục và hội đồng thẩm định đề thi xuất sắc của Việt Nam.
Dưới đây là danh sách câu hỏi hiện tại của đề thi môn ${subject || 'chuyên môn'} (khối lớp ${grade || 'phổ thông'}):
${JSON.stringify(questionsPayload, null, 2)}

YÊU CẦU CHỈNH SỬA TỪ GIÁO VIÊN:
"${instruction}"

NHIỆM VỤ CỦA BẠN:
1. Hãy thực hiện chính xác yêu cầu chỉnh sửa trên đối với toàn bộ đề thi.
2. ⚠️ BẮT BUỘC: Trả về ĐẦY ĐỦ TẤT CẢ ${questions.length} CÂU HỎI. KHÔNG ĐƯỢC CẮT BỚT HAY TÓM TẮT!
3. Chỉ sửa những gì được yêu cầu, giữ nguyên nội dung các câu không liên quan đến yêu cầu.
4. QUY ĐỊNH SVG: TUYỆT ĐỐI KHÔNG ghi mã <svg...> vào trường "content". Nếu cần hình minh họa hãy viết vào trường "svgFigure".
${SCIENTIFIC_NOTATION_RULE}

Format mỗi câu hỏi trong mảng JSON trả về:
[
  {
    "id": "<id câu hỏi gốc hoặc id mới>",
    "section": "<tên phần nếu có hoặc rỗng>",
    "type": "MULTIPLE_CHOICE",
    "content": "<nội dung câu hỏi sạch (không chứa mã svg)>",
    "options": ["A...", "B...", "C...", "D..."],
    "correctAnswer": "0",
    "points": 1,
    "explanation": "<lời giải thích sau khi sửa>",
    "svgFigure": "<mã <svg...> hợp lệ nếu có hình minh họa, nếu không thì để rỗng>"
  }
]
Chỉ trả về mảng JSON hợp lệ, không kèm văn bản markdown nào khác.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 65536
      }
    });
    const text = result.response.text().trim();
    const parsed = safeParseAIJSON(text);
    const rawQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

    const updatedQuestions = rawQuestions.map((q, idx) => normalizeAIQuestionContent(q, questions[idx] || {}, idx));

    res.json({ questions: updatedQuestions, total: updatedQuestions.length });
  } catch (error) {
    console.error('[AI Modify Exam] Error:', error);
    res.status(500).json({ message: formatErrorMessage(error, 'Lỗi khi AI chỉnh sửa đề thi: ') });
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
      return res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'Lỗi parse JSON từ AI Vision') });
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
    res.status(500).json({ message: formatErrorMessage(error, 'Lỗi khi quét ảnh OCR: ') });
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
      return res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'AI không phân tích được cấu trúc file. Vui lòng thử lại hoặc dùng chế độ thường.') });
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
    res.status(500).json({ message: formatErrorMessage(error, 'Lỗi khi AI phân tích tài liệu: ') });
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
      return res.status(500).json({ message: formatErrorMessage(typeof error !== 'undefined' ? error : (typeof err !== 'undefined' ? err : null), 'AI không thể tạo SVG từ hình vẽ này. Ảnh có thể quá mờ hoặc không phải hình toán học.') });
    }

    res.json({ svgCode: svgMatch[0] });
  } catch (error) {
    console.error('[AI Figure to SVG] Error:', error);
    res.status(500).json({ message: formatErrorMessage(error, 'Lỗi khi AI vẽ hình SVG: ') });
  }
});

// GET /api/ai/suggest-schools — Gợi ý tên trường học bằng AI
router.get('/suggest-schools', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'Chưa cấu hình GEMINI_API_KEY.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    const prompt = `Bạn là một từ điển tra cứu tên trường học tại Việt Nam.
Người dùng đang gõ từ khóa: "${q}"

Nhiệm vụ của bạn là dự đoán và gợi ý tối đa 5 tên TRƯỜNG HỌC THỰC TẾ tại Việt Nam khớp nhất với từ khóa này.
YÊU CẦU QUAN TRỌNG:
1. Gợi ý có thể bao gồm Tiểu học (Cấp 1), THCS (Cấp 2), THPT (Cấp 3) hoặc Đại học/Cao đẳng.
2. Tên trường phải CHÍNH XÁC, THỰC TẾ, và CÓ TỒN TẠI ở Việt Nam. Bao gồm cả tên tỉnh/thành phố nếu có thể (vd: "Trường THPT Chuyên Lê Hồng Phong, Nam Định").
3. Nếu từ khóa viết tắt hoặc gõ không dấu, hãy cố gắng dự đoán tên đầy đủ có dấu chuẩn xác.
4. CHỈ trả về DUY NHẤT một mảng JSON các chuỗi (string). KHÔNG giải thích, KHÔNG thêm định dạng markdown.

Ví dụ trả về:
["Trường THPT Chuyên Lê Hồng Phong, Nam Định", "Trường THCS Lê Quý Đôn, Hà Nội", "Đại học Bách Khoa Hà Nội"]`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 512
      }
    });

    const text = result.response.text().trim();
    const suggestions = safeParseAIJSON(text);

    res.json({ suggestions: Array.isArray(suggestions) ? suggestions : [] });
  } catch (error) {
    console.error('[AI Suggest Schools] Error:', error);
    res.status(500).json({ message: formatErrorMessage(error, 'Lỗi khi AI gợi ý tên trường: ') });
  }
});

module.exports = router;


