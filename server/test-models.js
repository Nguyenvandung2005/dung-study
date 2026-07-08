require('dotenv').config({ path: 'd:/IUH/00.CaNhan/dung-study/server/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const res = await model.generateContent("hello");
    console.log(res.response.text());
  } catch (e) {
    console.error("1.5-flash error:", e.message);
    try {
      const model2 = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const res2 = await model2.generateContent("hello");
      console.log("gemini-pro success:", res2.response.text());
    } catch (e2) {
      console.error("gemini-pro error:", e2.message);
    }
  }
}
list();
