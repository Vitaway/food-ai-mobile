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

/** Consumer app — patients, and org admins using their dual patient identity. */
export function ConsumerRoute({ children }: ConsumerRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isConsumer = useAuthStore(selectIsConsumer);
  const isCoach = useAuthStore(selectIsCoach);
  const isAdmin = useAuthStore(selectIsAdmin);
  const user = useAuthStore((s) => (selectIsAuthenticated(s) ? s.session?.user : null));
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.login} state={{ from: location }} replace />;
  }

  if (isCoach) {
    return <Navigate to={getDashboardPath('coach')} replace />;
  }

  const isOrgAdminPatient =
    isAdmin &&
    user?.accountRole === 'organization_admin' &&
    Boolean(user.patientId);

  if (isAdmin && !isOrgAdminPatient) {
    return <Navigate to={getDashboardPath('admin')} replace />;
  }

  if (!isConsumer && !isOrgAdminPatient) {
    return <Navigate to={AUTH_ROUTES.login} replace />;
  }

  return children;
}
