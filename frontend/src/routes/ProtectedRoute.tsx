import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { LoadingState } from '../components/common/LoadingState';
import { useAuth } from '../contexts/AuthContext';
import type { RoleName } from '../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: RoleName[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState label="Restoring session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
