import { useMutation } from '@tanstack/react-query';
import { AuthError, requestPasswordReset } from '@/features/auth/api/authApi';
import type { ForgotPasswordPayload } from '@/features/auth/types';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => requestPasswordReset(payload),
  });
}

export function getForgotPasswordErrorMessage(error: unknown): string {
  if (error instanceof AuthError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Unable to send reset link. Please try again.';
}
