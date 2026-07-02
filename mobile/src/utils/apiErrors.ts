import { ApiError } from '@/lib/apiClient';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'API endpoint not found. Check EXPO_PUBLIC_API_URL and that the server is running.';
    }
    if (error.status === 401) {
      return error.message === 'Request failed (401)'
        ? 'Invalid email or password.'
        : error.message;
    }
    if (error.status === 0) {
      return error.message || 'Cannot reach the API. Check that the server is running.';
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
