import { Navigate, useLocation } from 'react-router-dom';
import { AUTH_ROUTES } from '@/features/auth/constants';
import {
  selectIsAdmin,
  selectIsAuthenticated,
  selectIsCoach,
  useAuthStore,
} from '@/features/auth/stores/authStore';
import { getDashboardPath } from '@/features/auth/utils/routing';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

/** Coach dashboard — coaches only. */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isCoach = useAuthStore(selectIsCoach);
  const isAdmin = useAuthStore(selectIsAdmin);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.login} state={{ from: location }} replace />;
  }

  if (isAdmin) {
    return <Navigate to={getDashboardPath('admin')} replace />;
  }

  if (!isCoach) {
    return <Navigate to={AUTH_ROUTES.login} replace />;
  }

  return children;
}
