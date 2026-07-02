import { apiRequest, ApiError } from '@/lib/apiClient';
import { SESSION_TTL_MS } from '@/features/auth/constants';
import type {
  AuthSession,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterCredentials,
  UserRole,
} from '@/features/auth/types';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    displayName: string;
    avatarUrl: string | null;
    patientId?: string;
  };
  coachProfile?: {
    id: string;
    title: string | null;
    organization: string | null;
  };
  consumerProfile?: {
    patientId: string;
    onboardingComplete: boolean;
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

function mapRole(role: string): UserRole {
  if (role === 'admin') return 'admin';
  if (role === 'consumer') return 'consumer';
  return 'coach';
}

function mapAuthResponse(data: AuthResponse, rememberMe?: boolean): AuthSession {
  const ttl = rememberMe ? SESSION_TTL_MS : 24 * 60 * 60 * 1000;
  return {
    token: data.token,
    user: {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName,
      role: mapRole(data.user.role),
      avatarUrl: data.user.avatarUrl ?? undefined,
      patientId: data.user.patientId ?? data.consumerProfile?.patientId,
    },
    expiresAt: jwtExpiresAt(data.token, ttl),
    onboardingComplete: data.consumerProfile?.onboardingComplete,
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
    const data = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    });
    return mapAuthResponse(data, credentials.rememberMe);
  } catch (error) {
    toAuthError(error);
  }
}

export async function register(credentials: RegisterCredentials): Promise<AuthSession> {
  try {
    const data = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
        displayName: credentials.displayName.trim(),
      }),
    });
    return mapAuthResponse(data, credentials.rememberMe);
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
  await apiRequest<{ ok: boolean }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: payload.email.trim() }),
  });
}

export async function resetPasswordWithToken(token: string, password: string): Promise<void> {
  await apiRequest<{ ok: boolean }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function logoutCoach(): Promise<void> {
  try {
    await apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' });
  } catch {
    /* clear local session even if server logout fails */
  }
}
