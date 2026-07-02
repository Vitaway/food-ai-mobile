import { ApiError } from '@/lib/apiClient';
import { AuthError } from '@/features/auth/api/authApi';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AuthError) {
    return error.message;
  }

  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'API endpoint not found. Start the MiraFood API server (port 3011) or check your proxy URL.';
    }
    if (error.status === 401) {
      return error.message === 'Request failed (401)' || error.message === 'Unauthorized'
        ? 'Invalid email or password.'
        : error.message;
    }
    if (error.status === 0) {
      return error.message;
    }
    if (error.status >= 500) {
      return 'Server error — try again in a moment.';
    }
    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
