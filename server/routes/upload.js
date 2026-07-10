const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse'); // v1.1.1
const path = require('path');
const fs = require('fs');
const { authMiddleware, requireRole } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const router = express.Router();

// ── Cấu hình Cloudinary (chỉ khởi tạo nếu có đầy đủ keys) ──────────────────
const cloudinaryEnabled =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/temp');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.docx', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Chỉ hỗ trợ file .docx và .pdf'));
  }
});

/**
 * Parse questions from HTML content (Word files — preserves tables, formatting)
 * Splits by <p>Câu X.</p> pattern and collects following elements as content
 */
const parseQuestionsFromHtml = (html) => {
  // Add unique markers before every Câu X or just X. (e.g. "Câu 1.", "1.", "1)")
  const markedHtml = html.replace(/(^|>)([\s\xA0]*)(?:C\u00e2u\s+)?(\d+[:.)](?:\s|&nbsp;|<|\n|$))/gi, '$1$2|||SPLIT|||$3');
  const blocks = markedHtml.split('|||SPLIT|||').filter(b => b.trim());

  const questions = [];

  for (const block of blocks) {
    // Extract plain text to parse options and detect question
    const plainText = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const qMatch = plainText.match(/^(?:C\u00e2u\s+)?(\d+)[:.)](?:\s|&nbsp;)*([\s\S]*)/i);
    if (!qMatch) continue;

    const rawContent = qMatch[2].trim();
    const isExplicitEssay = /\[T\u1ef1\s*lu\u1eadn\]|\(T\u1ef1\s*lu\u1eadn\)|^TL[:.]/i.test(rawContent);

    // Extract options from plain text
    const optionLines = [];
    const optionPat = /\b([A-Da-d])[.)]\s+(.+?)(?=\s+[A-Da-d][.)]\s|\s*(?:\u0110\u00e1p\s*\u00e1n|$))/gi;
    let optMatch;
    while ((optMatch = optionPat.exec(plainText)) !== null) {
      if (!isExplicitEssay) {
        optionLines.push({ id: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
      }
    }

    let answerMatch = plainText.match(/(?:\u0110\u00e1p\s*\u00e1n|Answer|\u0110A)[:.]\s*([A-Da-d])/i);
    let explainMatch = plainText.match(/(?:G\u1ee3i\s*\u00fd|Gi\u1ea3i\s*th\u00edch|Explanation)[:.]\s*(.*?)(?=\n|<|$)/i);

    // Phát hiện đáp án in đậm trong file Word
    if (!answerMatch) {
      const boldMatch = block.match(/<(?:strong|b)[^>]*>\s*([A-Da-d])\s*<\/(?:strong|b)>\s*[.)]|<(?:strong|b)[^>]*>\s*([A-Da-d])\s*[.)]|([A-Da-d])\s*[.)]\s*<(?:strong|b)[^>]*>/i);
      if (boldMatch) {
        const boldAns = boldMatch[1] || boldMatch[2] || boldMatch[3];
        if (boldAns) answerMatch = [null, boldAns.toUpperCase()];
      }
    }

    let contentHtml = block.trim();
    contentHtml = contentHtml
      .replace(/<[^>]*>(?:\u0110\u00e1p\s*\u00e1n|Answer|\u0110A)[:.][^<]*<\/[^>]*>/gi, '')
      .replace(/<[^>]*>(?:G\u1ee3i\s*\u00fd|Gi\u1ea3i\s*th\u00edch|Explanation)[:.][^<]*<\/[^>]*>/gi, '')
      .replace(/\[T\u1ef1\s*lu\u1eadn\]|\(T\u1ef1\s*lu\u1eadn\)|^TL[:.]/gi, '')
      // Xóa thẻ in đậm ở các dòng chứa đáp án (để tránh lộ đáp án cho học sinh nếu content giữ nguyên options)
      .replace(/<(strong|b)[^>]*>(\s*[A-Da-d]\s*[.)].*?)<\/\1>/gi, '$2')
      .replace(/([A-Da-d]\s*[.)]\s*)<(strong|b)[^>]*>(.*?)<\/\2>/gi, '$1$3')
      .trim();

    const isMCQ = !isExplicitEssay && optionLines.length >= 2;

    questions.push({
      content: contentHtml,
      contentIsHtml: true,
      type: isMCQ ? 'SINGLE_CHOICE' : 'ESSAY',
      options: isMCQ ? optionLines : null,
      correctAnswer: answerMatch ? [answerMatch[1].toUpperCase()] : null,
      explanation: explainMatch ? explainMatch[1].trim() : null,
      points: isMCQ ? 1 : 2,
      order: questions.length + 1,
    });
  }
  return questions;
};

/**
 * Parse questions from plain text (PDF) — preserves newlines
 */
const parseQuestionsFromText = (text) => {
  const questions = [];
  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Robust split using marker, making "Câu " optional
  const markedText = normalized.replace(/(^|\n)([\s\xA0]*)(?:C\u00e2u\s+)?(\d+[:.)](?:\s|\n|$))/gi, '$1$2|||SPLIT|||$3');
  const questionBlocks = markedText.split('|||SPLIT|||').filter(b => b.trim());

  for (const block of questionBlocks) {
    const lines = block.split('\n').map(l => l.trimEnd()).filter(l => l.trim());
    if (!lines.length) continue;

    const qMatch = lines[0].match(/^(?:C\u00e2u\s+)?(\d+)[:.)]\s*([\s\S]*)/i);
    if (!qMatch) continue;

    const rawContent = qMatch[2].trim();
    const isExplicitEssay = /\[T\u1ef1\s*lu\u1eadn\]|\(T\u1ef1\s*lu\u1eadn\)|^TL[:.]/i.test(rawContent);
    let contentLines = [rawContent.replace(/\[T\u1ef1\s*lu\u1eadn\]|\(T\u1ef1\s*lu\u1eadn\)|^TL[:.]/gi, '').trim()];
    let i = 1;
    const options = [];
    let correctAnswer = null;
    let explanation = null;

    const optionPattern = /^([A-Da-d])[.)]\s+(.+)/;
    const answerPattern = /^(?:\u0110\u00e1p\s*\u00e1n|Answer|\u0110A)[:.]\s*([A-Da-d])/i;
    const explainPattern = /^(?:G\u1ee3i\s*\u00fd|Gi\u1ea3i\s*th\u00edch|Explanation)[:.]\s*(.*)/i;

    while (i < lines.length) {
      const line = lines[i];
      const optMatch = !isExplicitEssay && line.match(optionPattern);
      const ansMatch = line.match(answerPattern);
      const expMatch = line.match(explainPattern);

      if (optMatch) {
        options.push({ id: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
      } else if (ansMatch) {
        correctAnswer = [ansMatch[1].toUpperCase()];
      } else if (expMatch) {
        explanation = expMatch[1];
      } else {
        // Preserve all other lines in content
        contentLines.push(line);
      }
      i++;
    }

    const content = contentLines.join('\n').trim();
    const isMCQ = !isExplicitEssay && options.length >= 2;

    questions.push({
      content,
      contentIsHtml: false,
      type: isMCQ ? 'SINGLE_CHOICE' : 'ESSAY',
      options: isMCQ ? options : null,
      correctAnswer: isMCQ ? (correctAnswer || null) : null,
      explanation: explanation || null,
      points: isMCQ ? 1 : 2,
      order: questions.length + 1,
    });
  }
  return questions;
};

// POST /api/upload/word — uses HTML extraction to preserve tables/formatting
router.post('/word', authMiddleware, requireRole('TEACHER', 'ADMIN'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file .docx' });

    // Trích xuất ảnh nhúng trong file Word
    const embeddedImages = [];
    const htmlResult = await mammoth.convertToHtml(
      { path: req.file.path },
      {
        convertImage: mammoth.images.imgElement(function (image) {
          return image.read('base64').then(function (imageBuffer) {
            embeddedImages.push({ data: imageBuffer, mimeType: image.contentType || 'image/png' });
            return { src: `data:${image.contentType || 'image/png'};base64,${imageBuffer}` };
          });
        }),
      }
    );

    // Trích xuất plain text để AI có thể đọc
    const textResult = await mammoth.extractRawText({ path: req.file.path }).catch(() => ({ value: '' }));
    fs.unlinkSync(req.file.path);

    const questions = parseQuestionsFromHtml(htmlResult.value);
    if (questions.length === 0) {
      const fallback = parseQuestionsFromText(textResult.value);
      if (fallback.length === 0) {
        // Fallback: Treat entire document as 1 Essay question
        const singleEssay = [{
          content: htmlResult.value || textResult.value,
          contentIsHtml: !!htmlResult.value,
          type: 'ESSAY',
          options: null,
          correctAnswer: null,
          explanation: null,
          points: 10,
          order: 1
        }];
        return res.json({
          questions: singleEssay, total: 1,
          rawText: textResult.value,
          rawHtml: htmlResult.value,
          embeddedImages,
        });
      }
      return res.json({
        questions: fallback, total: fallback.length,
        rawText: textResult.value,
        rawHtml: htmlResult.value,
        embeddedImages,
      });
    }
    res.json({
      questions,
      total: questions.length,
      rawText: textResult.value,
      rawHtml: htmlResult.value,
      embeddedImages,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Lỗi khi đọc file Word: ' + error.message });
  }
});

// POST /api/upload/pdf — preserves newlines and table-like text
router.post('/pdf', authMiddleware, requireRole('TEACHER', 'ADMIN'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file .pdf' });
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    fs.unlinkSync(req.file.path);
    const rawText = data.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    const questions = parseQuestionsFromText(rawText);
    if (questions.length === 0) {
      // Fallback: Treat entire document as 1 Essay question
      const singleEssay = [{
        content: rawText,
        contentIsHtml: false,
        type: 'ESSAY',
        options: null,
        correctAnswer: null,
        explanation: null,
        points: 10,
        order: 1
      }];
      return res.json({ questions: singleEssay, total: 1, rawText });
    }
    res.json({ questions, total: questions.length, rawText });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Lỗi khi đọc file PDF: ' + error.message });
  }
});

// ── Storage cho ảnh bài làm: Cloudinary hoặc Local Disk ─────────────────────
const imageStorage = cloudinaryEnabled
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'dung-study/answers',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/answers');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
      }
    });

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Chỉ hỗ trợ file hình ảnh (.jpg, .jpeg, .png, .webp, .gif)'));
  }
});

// POST /api/upload/image — upload student essay photo answers
// Nếu Cloudinary được cấu hình → trả về URL đám mây HTTPS
// Nếu chưa cấu hình → trả về path local như cũ
router.post('/image', authMiddleware, uploadImage.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn file ảnh để tải lên' });
    // Cloudinary: req.file.path là URL đám mây; Local: tạo path local
    const fileUrl = cloudinaryEnabled
      ? req.file.path  // Cloudinary trả về URL đầy đủ trong req.file.path
      : `/uploads/answers/${req.file.filename}`;
    res.json({ url: fileUrl, isCloud: !!cloudinaryEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải ảnh lên: ' + error.message });
  }
});

module.exports = router;

