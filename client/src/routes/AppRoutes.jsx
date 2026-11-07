import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import ElderlyDashboard from '../pages/ElderlyDashboard';
import FamilyDashboard from '../pages/FamilyDashboard';
import VoiceCheckin from '../pages/VoiceCheckin';
import ConversationHistory from '../pages/ConversationHistory';
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
            <ElderlyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/family"
        element={
          <ProtectedRoute>
            <FamilyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/check-in"
        element={
          <ProtectedRoute>
            <VoiceCheckin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <ConversationHistory />
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
