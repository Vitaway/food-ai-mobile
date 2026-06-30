import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthError, loginCoach } from '@/features/auth/api/authApi';
import { COACH_ROUTES } from '@/features/auth/constants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { LoginCredentials } from '@/features/auth/types';

type LoginLocationState = {
  from?: { pathname: string };
};

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const redirectTo =
    (location.state as LoginLocationState | null)?.from?.pathname ?? COACH_ROUTES.dashboard;

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => loginCoach(credentials),
    onSuccess: (session) => {
      setSession(session);
      navigate(redirectTo, { replace: true });
    },
  });
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof AuthError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
