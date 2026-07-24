import { apiRequest } from '@/lib/apiClient';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  patientId?: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
  consumerProfile?: {
    patientId: string;
    onboardingComplete: boolean;
  };
};

/** Staff login may return this instead of a session (OTP on web). */
export type MfaChallengeResponse = {
  mfaRequired: true;
  challengeToken: string;
  email: string;
  role?: string;
  debugCode?: string;
};

export type LoginApiResult = AuthResponse | MfaChallengeResponse;

export type MeResponse = AuthUser & {
  consumerProfile?: AuthResponse['consumerProfile'];
};

export function isMfaChallenge(value: LoginApiResult): value is MfaChallengeResponse {
  return Boolean(value && typeof value === 'object' && 'mfaRequired' in value && value.mfaRequired);
}

export async function fetchMeRequest(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/auth/me', { method: 'POST' });
}

export async function loginRequest(email: string, password: string): Promise<LoginApiResult> {
  return apiRequest<LoginApiResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });
}

export async function registerRequest(
  email: string,
  password: string,
  displayName: string,
  referralCode?: string,
  registrationSource?: 'individual' | 'company' | 'institution',
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      ...(referralCode?.trim() ? { referralCode: referralCode.trim().toUpperCase() } : {}),
      ...(registrationSource ? { registrationSource } : {}),
    }),
  });
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST' });
  } catch {
    /* ignore */
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest<{ ok: boolean }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function verifyResetCode(email: string, code: string): Promise<void> {
  await apiRequest<{ ok: boolean }>('/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), code: code.trim() }),
  });
}

export async function resetPasswordWithOtp(
  email: string,
  code: string,
  password: string,
): Promise<void> {
  await apiRequest<{ ok: boolean }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim(),
      code: code.trim(),
      password,
    }),
  });
}
