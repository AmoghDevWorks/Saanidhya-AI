import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import DashboardPlaceholder from '../pages/DashboardPlaceholder';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/useAuth';

const RootRedirect = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    return (
      <Navigate
        to={user.accountType === 'family' ? '/family' : '/dashboard'}
        replace
      />
    );
  }

  return <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Role-Based Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder pageTitle="Elderly Care Dashboard (Voice & Wellness)" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/family"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder pageTitle="Family Care Circle (Caregiver Portal)" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/check-in"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder pageTitle="Daily Voice Check-in (Prisma + Timbre)" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder pageTitle="Wellness & Conversational History (Evon)" />
          </ProtectedRoute>
        }
      />

      {/* Root and Fallback Navigation */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
