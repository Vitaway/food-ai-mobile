import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthError, login } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { resolvePostLoginPath } from '@/features/auth/utils/routing';
import type { AuthSession, LoginCredentials, MfaChallenge } from '@/features/auth/types';

type LoginLocationState = {
  from?: { pathname: string };
};

function isMfaChallenge(value: AuthSession | MfaChallenge): value is MfaChallenge {
  return 'mfaRequired' in value && value.mfaRequired === true;
}

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const from = (location.state as LoginLocationState | null)?.from?.pathname;

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (result) => {
      if (isMfaChallenge(result)) {
        return;
      }
      setSession(result);
      navigate(resolvePostLoginPath(result.user.role, from), { replace: true });
    },
  });
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof AuthError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
