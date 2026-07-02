import { Navigate, useLocation } from 'react-router-dom';
import { AUTH_ROUTES } from '@/features/auth/constants';
import {
  selectIsAdmin,
  selectIsAuthenticated,
  selectIsCoach,
  selectIsConsumer,
  useAuthStore,
} from '@/features/auth/stores/authStore';
import { getDashboardPath } from '@/features/auth/utils/routing';

type ConsumerRouteProps = {
  children: React.ReactNode;
};

/** Consumer app — consumers only. */
export function ConsumerRoute({ children }: ConsumerRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isConsumer = useAuthStore(selectIsConsumer);
  const isCoach = useAuthStore(selectIsCoach);
  const isAdmin = useAuthStore(selectIsAdmin);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.login} state={{ from: location }} replace />;
  }

  if (isCoach) {
    return <Navigate to={getDashboardPath('coach')} replace />;
  }

  if (isAdmin) {
    return <Navigate to={getDashboardPath('admin')} replace />;
  }

  if (!isConsumer) {
    return <Navigate to={AUTH_ROUTES.login} replace />;
  }

  return children;
}
