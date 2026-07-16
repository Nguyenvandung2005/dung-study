require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
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
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, credentials: true },
  maxHttpBufferSize: 1e6
});

app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: formatErrorMessage(err) });
});

// ─── Socket.IO: WebRTC Signaling for Screen Monitoring ────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'dung_study_secret_key_123456_secure';
const monitorRooms = {}; // examId -> { teacherSocketId, students: Map }

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Giáo viên vào phòng giám sát
  socket.on('teacher:join-monitor', ({ examId, teacherName }) => {
    const room = `monitor-${examId}`;
    socket.join(room);
    if (!monitorRooms[examId]) monitorRooms[examId] = { teacherSocketId: null, students: {} };
    monitorRooms[examId].teacherSocketId = socket.id;
    socket.examId = examId;
    socket.role = 'teacher';
    // Gửi danh sách học sinh đang có mặt
    socket.emit('monitor:student-list', Object.values(monitorRooms[examId].students));
  });

  // Học sinh vào phòng thi
  socket.on('student:join-exam', ({ examId, studentName }) => {
    const room = `monitor-${examId}`;
    socket.join(room);
    if (!monitorRooms[examId]) monitorRooms[examId] = { teacherSocketId: null, students: {} };
    monitorRooms[examId].students[socket.id] = {
      socketId: socket.id, userId: socket.userId,
      name: studentName, joinedAt: Date.now()
    };
    socket.examId = examId;
    socket.role = 'student';
    socket.studentName = studentName;
    // Báo giáo viên
    const tid = monitorRooms[examId]?.teacherSocketId;
    if (tid) io.to(tid).emit('monitor:student-joined', {
      socketId: socket.id, userId: socket.userId, name: studentName
    });
  });

  // Học sinh gửi WebRTC offer
  socket.on('student:offer', ({ examId, offer }) => {
    const tid = monitorRooms[examId]?.teacherSocketId;
    if (tid) io.to(tid).emit('monitor:offer', {
      studentSocketId: socket.id, studentName: socket.studentName, offer
    });
  });

  // Giáo viên gửi answer về học sinh
  socket.on('teacher:answer', ({ studentSocketId, answer }) => {
    io.to(studentSocketId).emit('monitor:answer', { answer });
  });

  // ICE candidates
  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    if (targetSocketId) io.to(targetSocketId).emit('ice-candidate', { from: socket.id, candidate });
  });

  // Giáo viên yêu cầu học sinh bắt đầu stream
  socket.on('teacher:request-stream', ({ studentSocketId }) => {
    io.to(studentSocketId).emit('monitor:request-stream');
  });

  socket.on('disconnect', () => {
    const { examId, role } = socket;
    if (!examId || !monitorRooms[examId]) return;
    if (role === 'student') {
      delete monitorRooms[examId].students[socket.id];
      const tid = monitorRooms[examId]?.teacherSocketId;
      if (tid) io.to(tid).emit('monitor:student-left', { socketId: socket.id });
    } else if (role === 'teacher') {
      monitorRooms[examId].teacherSocketId = null;
    }
  });
});

process.on('uncaughtException', (err) => { console.error('[Uncaught Exception]', err); });
process.on('unhandledRejection', (reason) => { console.error('[Unhandled Rejection]', reason); });

server.listen(PORT, () => {
  console.log(`🚀 Dung Study Server running on port ${PORT}`);
});

module.exports = app;
