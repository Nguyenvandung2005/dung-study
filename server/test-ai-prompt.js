const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

const prompt = `Bạn là một chuyên gia giáo dục Việt Nam, am hiểu sâu về mọi định dạng đề thi.
Hãy đọc kỹ nội dung sau được trích xuất từ file đề thi (Word .docx).
Các hình đính kèm là hình vẽ/sơ đồ được nhúng trong tài liệu (lần lượt index 0, 1, 2...).

NỘI DUNG FILE:
---
Phần I: Trắc nghiệm (4 điểm).
Câu 1. Tìm cách viết đúng trong các cách viết sau?
A. 3,2 \in N
B. 0 \in N*
C. 0 \in N
D. 0 \in N

Phần II: Tự luận (6 điểm).
Câu 5. (2 điểm) Vẽ sơ đồ nhà của bạn (hình bên dưới).
[IMAGE 0 HERE]
Câu 6. Tính diện tích.
---

YÊU CẦU PHÂN TÍCH (CỰC KỲ QUAN TRỌNG):
1. Nhận diện TẤT CẢ câu hỏi.
2. Câu trắc nghiệm (MULTIPLE_CHOICE): NẾU CÓ CÁC LỰA CHỌN A, B, C, D (hoặc tương tự) THÌ BẮT BUỘC PHẢI CHỌN LOẠI MULTIPLE_CHOICE. BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC GỘP CÁC LỰA CHỌN NÀY VÀO TRONG PHẦN "content" DƯỚI DẠNG ESSAY. Phải tách rời thành mảng "options" với độ dài chính xác 4.
3. Câu tự luận (ESSAY): Chỉ dùng khi hoàn toàn không có lựa chọn A/B/C/D.
4. "hasFigure": Nếu câu hỏi đề cập đến hình (ví dụ "hình bên", "hình sau"), hãy đặt true. Nếu file có ảnh đính kèm (có index 0, 1...), hãy dự đoán và gán "figureImageIndex" = chỉ số của ảnh đó (thường ảnh xuất hiện sau câu hỏi), hoặc -1 nếu không chắc chắn.
5. "correctAnswer": Là vị trí của đáp án đúng (0, 1, 2, 3 tương ứng A, B, C, D). Trích xuất từ đáp án cuối đề nếu có.

Trả về mảng JSON hợp lệ theo format:
[
  {
    "type": "MULTIPLE_CHOICE",
    "content": "Nội dung câu hỏi đầy đủ (KHÔNG BAO GỒM A,B,C,D)",
    "options": ["Nội dung A", "Nội dung B", "Nội dung C", "Nội dung D"],
    "correctAnswer": "0",
    "points": 1,
    "explanation": "Giải thích",
    "hasFigure": false,
    "figureImageIndex": -1
  }
]`;

model.generateContent(prompt).then(res => console.log(res.response.text())).catch(console.error);
