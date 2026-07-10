const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const prompt = `Bạn là chuyên gia giáo dục. Trả về mảng JSON hợp lệ theo format:
[
  {
    "type": "MULTIPLE_CHOICE",
    "content": "Nội dung câu hỏi đầy đủ",
    "options": ["Nội dung A", "Nội dung B", "Nội dung C", "Nội dung D"],
    "correctAnswer": "0",
    "points": 1,
    "explanation": "Giải thích",
    "hasFigure": false,
    "figureImageIndex": -1
  }
]
Nội dung:
Phần I: Trắc nghiệm (4 điểm).
Câu 1. Tìm cách viết đúng trong các cách viết sau?
A. 3,2 \in N
B. 0 \in N*
C. 0 \in N
D. 0 \in N
Câu 2. Số nào sau đây chia hết cho 2;3;5;9?
A. 39595
B. 39590
C. 39690
D. 39592`;
model.generateContent(prompt).then(res => console.log(res.response.text())).catch(console.error);
