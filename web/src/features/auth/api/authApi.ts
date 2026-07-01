import { apiRequest, ApiError } from '@/lib/apiClient';
import { SESSION_TTL_MS } from '@/features/auth/constants';
import type { AuthSession, ForgotPasswordPayload, LoginCredentials } from '@/features/auth/types';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    displayName: string;
    avatarUrl: string | null;
  };
  coachProfile?: {
    id: string;
    title: string | null;
    organization: string | null;
  };
};

function jwtExpiresAt(token: string, fallbackMs: number): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000;
    }
  } catch {
    /* use fallback */
  }
  return Date.now() + fallbackMs;
}

function mapLoginResponse(data: LoginResponse, rememberMe?: boolean): AuthSession {
  const ttl = rememberMe ? SESSION_TTL_MS : 24 * 60 * 60 * 1000;
  return {
    token: data.token,
    user: {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName,
      role: (data.user.role === 'admin' ? 'admin' : 'coach') as AuthSession['user']['role'],
      avatarUrl: data.user.avatarUrl ?? undefined,
    },
    expiresAt: jwtExpiresAt(data.token, ttl),
  };
}

function toAuthError(error: unknown): never {
  if (error instanceof ApiError) {
    throw new AuthError(error.message);
  }
  if (error instanceof Error) {
    throw new AuthError(error.message);
  }
  throw new AuthError('Something went wrong. Please try again.');
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  try {
    const data = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    });
    return mapLoginResponse(data, credentials.rememberMe);
  } catch (error) {
    toAuthError(error);
  }
}

/** @deprecated Use `login` */
export const loginCoach = login;

export async function requestPasswordReset(payload: ForgotPasswordPayload): Promise<void> {
  if (!payload.email.trim()) {
    throw new AuthError('Please enter your email address.');
  }
  if (!payload.email.includes('@')) {
    throw new AuthError('Please enter a valid email address.');
  }
  throw new AuthError('Password reset is not available yet. Contact support@vitaway.com.');
}

export async function logoutCoach(): Promise<void> {
  try {
    await apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' });
  } catch {
    /* clear local session even if server logout fails */
  }
}
