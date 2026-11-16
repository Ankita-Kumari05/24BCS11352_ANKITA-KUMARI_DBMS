import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const roleDashboard = {
  STUDENT: '/student/dashboard',
  COMPANY: '/company/dashboard',
  TPO_ADMIN: '/admin/dashboard',
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirect = roleDashboard[user.role] || '/login';
    return <Navigate to={redirect} replace />;
  }

  return children;
}
