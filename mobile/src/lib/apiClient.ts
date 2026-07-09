import { API_BASE_URL, getApiV1Url } from '@/constants/api';
import { emitUnauthorized } from '@/lib/authEvents';

let authToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

export function getApiAuthToken() {
  return authToken;
}

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_TIMEOUT_MS = 8_000;

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError('API is not configured. Set EXPO_PUBLIC_API_URL.', 0);
  }

  const headers = new Headers(options.headers as HeadersInit);
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(getApiV1Url(path), {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const isNetworkFailure =
      isAbort || (err instanceof TypeError && /network request failed/i.test(err.message));
    const message = isAbort
      ? `The API at ${API_BASE_URL} took too long to respond. Check your connection or server.`
      : isNetworkFailure
        ? `Cannot reach the API at ${API_BASE_URL}. Start the server (cd server && npm run dev) or run docker compose up in server/.`
        : err instanceof Error
          ? err.message
          : 'Network request failed';
    throw new ApiError(message, 0);
  } finally {
    clearTimeout(timeoutId);
  }

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & Record<string, unknown>;

  if (!response.ok || body.success === false) {
    if (response.status === 401 && authToken) {
      emitUnauthorized();
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

  return body as T;
}
