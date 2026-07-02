import { ApiError } from '@/lib/apiClient';
import { API_BASE_URL } from '@/constants/api';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      if (API_BASE_URL.includes('mirafood.vitaway.org') || API_BASE_URL.includes('vitaway.nsengi.space')) {
        return 'Sign-in API is not deployed on this server yet. Use local API (127.0.0.1:3011) for dev.';
      }
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
