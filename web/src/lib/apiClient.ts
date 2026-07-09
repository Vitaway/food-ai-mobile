import { useAuthStore } from '@/features/auth/stores/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export function getApiBaseUrl() {
  return API_BASE;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

function getAuthHeaders(): HeadersInit {
  const token = useAuthStore.getState().session?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  for (const [key, value] of Object.entries(getAuthHeaders())) {
    headers.set(key, value);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & Record<string, unknown>;

  if (!response.ok) {
    const message =
      (typeof body.error === 'string' && body.error) ||
      (typeof body.message === 'string' && body.message) ||
      (response.status === 404 ? 'Route not found' : `Request failed (${response.status})`);
    throw new ApiError(message, response.status);
  }

  if (body.success === true && 'data' in body) {
    return body.data as T;
  }

  if (body.success === false) {
    throw new ApiError(body.error ?? 'Request failed', response.status);
  }

  return body as T;
}
