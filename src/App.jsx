import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import ArchitecturePage from './pages/ArchitecturePage';
import PrivateRoute from './components/ui/PrivateRoute';
import AdminRealtimeNotifier from './components/admin/AdminRealtimeNotifier';

// Dashboards
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Admin sub-pages
import AdminUsers from './pages/admin/AdminUsers';
import AdminExams from './pages/admin/AdminExams';
import AdminSecurity from './pages/admin/AdminSecurity';
import AdminThemeSettings from './pages/admin/AdminThemeSettings';

import TeacherCreateExam from './pages/teacher/TeacherCreateExam';
import TeacherEditExam from './pages/teacher/TeacherEditExam';
import TeacherStats from './pages/teacher/TeacherStats';
import TeacherGrading from './pages/teacher/TeacherGrading';
import TeacherMonitor from './pages/teacher/TeacherMonitor';

// Student sub-pages
import StudentExams from './pages/student/StudentExams';
import StudentHistory from './pages/student/StudentHistory';
import StudentTakeExam from './pages/student/StudentTakeExam';
import StudentResult from './pages/student/StudentResult';
import StudentLeaderboard from './pages/student/StudentLeaderboard';
import ProfilePage from './pages/ProfilePage';
import ScrollToTop from './components/ui/ScrollToTop';

const ALL_ROLES = ['STUDENT', 'TEACHER', 'ADMIN'];

const TEACHER_ROLES = ['TEACHER', 'ADMIN'];
const STUDENT_ROLES = ['STUDENT', 'ADMIN'];
const ADMIN_ROLES = ['ADMIN'];

function ProtectedRoute({ roles, children }) {
  return <PrivateRoute roles={roles}>{children}</PrivateRoute>;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080818' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 16px' }} />
          <p style={{ color: '#a0a0c8', fontFamily: 'sans-serif' }}>Đang khởi tạo Dung-Study...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <AdminRealtimeNotifier />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />

        {/* Global Protected Routes */}
        <Route path="/profile" element={
          <ProtectedRoute roles={ALL_ROLES}><ProfilePage /></ProtectedRoute>
        } />

        {/* ─── Student Routes ─── */}
        <Route path="/student" element={
          <ProtectedRoute roles={STUDENT_ROLES}><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/student/exams" element={
          <ProtectedRoute roles={STUDENT_ROLES}><StudentExams /></ProtectedRoute>
        } />
        <Route path="/student/history" element={
          <ProtectedRoute roles={STUDENT_ROLES}><StudentHistory /></ProtectedRoute>
        } />
        {/* Placeholder routes for exam-taking and results (to be built in next phase) */}
        <Route path="/student/exam/:examId" element={
          <ProtectedRoute roles={STUDENT_ROLES}><StudentTakeExam /></ProtectedRoute>
        } />
        <Route path="/student/result/:submissionId" element={
          <ProtectedRoute roles={STUDENT_ROLES}><StudentResult /></ProtectedRoute>
        } />
        <Route path="/student/leaderboard" element={
          <ProtectedRoute roles={STUDENT_ROLES}><StudentLeaderboard /></ProtectedRoute>
        } />

        {/* ─── Teacher Routes ─── */}
        <Route path="/teacher" element={
          <ProtectedRoute roles={TEACHER_ROLES}><TeacherDashboard /></ProtectedRoute>
        } />
        <Route path="/teacher/exams" element={
          <ProtectedRoute roles={TEACHER_ROLES}><TeacherDashboard /></ProtectedRoute>
        } />
        <Route path="/teacher/create" element={
          <ProtectedRoute roles={TEACHER_ROLES}><TeacherCreateExam /></ProtectedRoute>
        } />
        <Route path="/teacher/edit/:examId" element={
          <ProtectedRoute roles={TEACHER_ROLES}><TeacherEditExam /></ProtectedRoute>
        } />
        <Route path="/teacher/statistics" element={
          <ProtectedRoute roles={TEACHER_ROLES}><TeacherStats /></ProtectedRoute>
        } />
        <Route path="/teacher/statistics/:examId" element={
          <ProtectedRoute roles={TEACHER_ROLES}><TeacherStats /></ProtectedRoute>
        } />
        <Route path="/teacher/grading" element={
          <ProtectedRoute roles={TEACHER_ROLES}><TeacherGrading /></ProtectedRoute>
        } />
        <Route path="/teacher/monitor/:examId" element={
          <ProtectedRoute roles={TEACHER_ROLES}><TeacherMonitor /></ProtectedRoute>
        } />

        {/* ─── Admin Routes ─── */}
        <Route path="/admin" element={
          <ProtectedRoute roles={ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={ADMIN_ROLES}><AdminUsers /></ProtectedRoute>
        } />
        <Route path="/admin/exams" element={
          <ProtectedRoute roles={ADMIN_ROLES}><AdminExams /></ProtectedRoute>
        } />
        <Route path="/admin/security" element={
          <ProtectedRoute roles={ADMIN_ROLES}><AdminSecurity /></ProtectedRoute>
        } />
        <Route path="/admin/animation" element={
          <ProtectedRoute roles={ADMIN_ROLES}><AdminThemeSettings /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
