import { Navigate, useLocation } from 'react-router-dom';
import { COACH_ROUTES } from '@/features/auth/constants';
import { selectIsAuthenticated, useAuthStore } from '@/features/auth/stores/authStore';

type GuestRouteProps = {
  children: React.ReactNode;
};

export function GuestRoute({ children }: GuestRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const location = useLocation();

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    return <Navigate to={from ?? COACH_ROUTES.dashboard} replace />;
  }

  return children;
}
