require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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
  console.error(err.stack);
  res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(PORT, () => {
  console.log(`🚀 Dung Study Server running on port ${PORT}`);
});

module.exports = app;
 
