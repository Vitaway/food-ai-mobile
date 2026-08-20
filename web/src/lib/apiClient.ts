import { useAuthStore } from '@/features/auth/stores/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export function getApiBaseUrl() {
  return API_BASE;
}

/**
 * WebSocket base matching production nginx (`/ws/...`) and Vite `/ws` proxy.
 * Do not append under `/api/v1`; server attaches sockets at `/ws/chat`, etc.
 */
export function getWsBaseUrl() {
  const api = API_BASE.replace(/\/$/, '');
  if (api.startsWith('http://') || api.startsWith('https://')) {
    const origin = api.replace(/\/api\/v1$/i, '');
    return origin.replace(/^http/i, 'ws');
  }
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.host}`;
  }
  return 'ws://127.0.0.1:3011';
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

  const hadToken = Boolean(useAuthStore.getState().session?.token);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & Record<string, unknown>;

  if (!response.ok) {
    if (response.status === 401 && hadToken) {
      useAuthStore.getState().clearSession();
    }
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
    if (response.status === 401 && hadToken) {
      useAuthStore.getState().clearSession();
    }
    throw new ApiError(body.error ?? 'Request failed', response.status);
  }

  return body as T;
}
