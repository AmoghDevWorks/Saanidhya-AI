import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute
 * Guards routes requiring an authenticated backend session.
 * Supports optional role-based authorization (e.g. elderly vs. family).
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-slate-700">
        <Loader2 size={36} className="animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold">Verifying your session...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login while preserving attempted location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based authorization check (if specific roles are required)
  if (allowedRoles && user && !allowedRoles.includes(user.accountType)) {
    // Redirect to the user's role-appropriate home
    const target = user.accountType === 'family' ? '/family' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
};

export default ProtectedRoute;
