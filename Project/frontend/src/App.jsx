import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

import Login from './pages/Login';
import Register from './pages/Register';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import EligibleDrives from './pages/student/EligibleDrives';
import MyApplications from './pages/student/MyApplications';

import CompanyDashboard from './pages/company/CompanyDashboard';
import PostDrive from './pages/company/PostDrive';
import MyDrives from './pages/company/MyDrives';
import ManageApplicants from './pages/company/ManageApplicants';

import AdminDashboard from './pages/admin/AdminDashboard';
import DepartmentStats from './pages/admin/DepartmentStats';
import AuditLog from './pages/admin/AuditLog';
import ManageAdmins from './pages/admin/ManageAdmins';

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  const dashboardMap = {
    STUDENT: '/student/dashboard',
    COMPANY: '/company/dashboard',
    TPO_ADMIN: '/admin/dashboard',
  };

  return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <h1 className="text-6xl font-bold text-indigo-600">404</h1>
      <p className="text-xl text-gray-600">Page not found</p>
      <a href="/" className="btn-primary mt-4">
        Go Home
      </a>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/drives"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <EligibleDrives />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <MyApplications />
              </ProtectedRoute>
            }
          />

          {/* Company Routes */}
          <Route
            path="/company/dashboard"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/post-drive"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <PostDrive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/my-drives"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <MyDrives />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/applicants/:driveId"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <ManageApplicants />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['TPO_ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stats"
            element={
              <ProtectedRoute allowedRoles={['TPO_ADMIN']}>
                <DepartmentStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute allowedRoles={['TPO_ADMIN']}>
                <AuditLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-admins"
            element={
              <ProtectedRoute allowedRoles={['TPO_ADMIN']}>
                <ManageAdmins />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
