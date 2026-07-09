import { ApiError } from '@/lib/apiClient';
import { API_BASE_URL } from '@/constants/api';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return `API endpoint not found (${API_BASE_URL}). Restart the API (docker compose up --build in server/) and reload the app.`;
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
