const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const res = await model.generateContent('Hi');
    console.log(`Model ${modelName} SUCCESS:`, res.response.text());
  } catch(e) {
    console.log(`Model ${modelName} FAILED:`, e.message);
  }
}

async function run() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-1.5-flash-latest');
  await testModel('gemini-flash-lite-latest');
}
run();
