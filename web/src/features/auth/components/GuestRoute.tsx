import { Navigate, useLocation } from 'react-router-dom';
import {
  selectAuthUser,
  selectIsAuthenticated,
  useAuthStore,
} from '@/features/auth/stores/authStore';
import { resolvePostLoginPath } from '@/features/auth/utils/routing';

type GuestRouteProps = {
  children: React.ReactNode;
};

export function GuestRoute({ children }: GuestRouteProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectAuthUser);
  const location = useLocation();

  if (isAuthenticated && user) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
    return (
      <Navigate
        to={resolvePostLoginPath(user.role, from)}
        replace
      />
    );
  }

  return children;
}
