import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on user role
    if (user?.role === 'student') {
      return <Navigate to="/dashboard/student" replace />;
    } else if (user?.role === 'parent') {
      return <Navigate to="/dashboard/parent" replace />;
    } else if (user?.role === 'teacher') {
      return <Navigate to="/dashboard/teacher" replace />;
    } else {
      // If role doesn't match any dashboard, redirect to home
      return <Navigate to="/" replace />;
    }
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute; 