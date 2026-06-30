import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutCoach } from '@/features/auth/api/authApi';
import { COACH_ROUTES } from '@/features/auth/constants';
import {
  selectAuthUser,
  selectIsAuthenticated,
  useAuthStore,
} from '@/features/auth/stores/authStore';

export function useAuth() {
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectAuthUser);
  const clearSession = useAuthStore((s) => s.clearSession);

  const logout = useCallback(async () => {
    try {
      await logoutCoach();
    } finally {
      clearSession();
      navigate(COACH_ROUTES.login, { replace: true });
    }
  }, [clearSession, navigate]);

  return {
    session,
    user,
    isAuthenticated,
    logout,
  };
}
