import {
  DEMO_COACH_EMAIL,
  DEMO_COACH_PASSWORD,
  SESSION_TTL_MS,
} from '@/features/auth/constants';
import type { AuthSession, ForgotPasswordPayload, LoginCredentials } from '@/features/auth/types';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginCoach(credentials: LoginCredentials): Promise<AuthSession> {
  await delay(650);

  const email = credentials.email.trim().toLowerCase();
  if (email !== DEMO_COACH_EMAIL || credentials.password !== DEMO_COACH_PASSWORD) {
    throw new AuthError('Invalid email or password. Please try again.');
  }

  const ttl = credentials.rememberMe ? SESSION_TTL_MS : 24 * 60 * 60 * 1000;

  return {
    token: `mock_${crypto.randomUUID()}`,
    user: {
      id: 'coach_1',
      email: DEMO_COACH_EMAIL,
      displayName: 'Coach Vitaway',
      role: 'coach',
    },
    expiresAt: Date.now() + ttl,
  };
}

export async function requestPasswordReset(payload: ForgotPasswordPayload): Promise<void> {
  await delay(800);

  if (!payload.email.trim()) {
    throw new AuthError('Please enter your email address.');
  }

  // Mock — always succeeds for valid-looking email
  if (!payload.email.includes('@')) {
    throw new AuthError('Please enter a valid email address.');
  }
}

export async function logoutCoach(): Promise<void> {
  await delay(200);
}
