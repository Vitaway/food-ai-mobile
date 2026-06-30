import { Navigate, useLocation } from 'react-router-dom';
import { COACH_ROUTES } from '@/features/auth/constants';
import { selectIsAuthenticated, useAuthStore } from '@/features/auth/stores/authStore';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={COACH_ROUTES.login} state={{ from: location }} replace />;
  }

  return children;
}
