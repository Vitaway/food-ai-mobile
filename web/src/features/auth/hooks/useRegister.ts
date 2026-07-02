import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AuthError, register } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { resolvePostLoginPath } from '@/features/auth/utils/routing';
import type { RegisterCredentials } from '@/features/auth/types';

export function useRegister() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => register(credentials),
    onSuccess: (session) => {
      setSession(session);
      navigate(resolvePostLoginPath(session.user.role), { replace: true });
    },
  });
}

export function getRegisterErrorMessage(error: unknown): string {
  if (error instanceof AuthError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
