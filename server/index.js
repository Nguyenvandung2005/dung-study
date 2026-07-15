require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { formatErrorMessage } = require('./utils/errorHandler');

const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');
const submissionRoutes = require('./routes/submissions');
const statisticsRoutes = require('./routes/statistics');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/users');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Cho phép mọi tên miền Frontend (Vercel/Netlify) truy cập API
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({ message: formatErrorMessage(err) });
});

// Bắt lỗi crash NodeJS để ghi log
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  require('./utils/errorHandler').formatErrorMessage(err, 'Lỗi hệ thống nghiêm trọng');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
  require('./utils/errorHandler').formatErrorMessage(reason, 'Lỗi hệ thống chưa xử lý');
});

app.listen(PORT, () => {
  console.log(`🚀 Dung Study Server running on port ${PORT}`);
});

module.exports = app;
 
