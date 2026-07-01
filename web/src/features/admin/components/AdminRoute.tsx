import { Navigate, useLocation } from 'react-router-dom';
import { AUTH_ROUTES } from '@/features/auth/constants';
import {
  selectIsAdmin,
  selectIsAuthenticated,
  selectIsCoach,
  useAuthStore,
} from '@/features/auth/stores/authStore';
import { getDashboardPath } from '@/features/auth/utils/routing';

type AdminRouteProps = {
  children: React.ReactNode;
};

/** Platform admin — admins only. */
export function AdminRoute({ children }: AdminRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isAdmin = useAuthStore(selectIsAdmin);
  const isCoach = useAuthStore(selectIsCoach);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.login} state={{ from: location }} replace />;
  }

  if (isCoach) {
    return <Navigate to={getDashboardPath('coach')} replace />;
  }

  if (!isAdmin) {
    return <Navigate to={AUTH_ROUTES.login} replace />;
  }

  return children;
}
