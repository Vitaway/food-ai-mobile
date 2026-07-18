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

export type MeResponse = AuthUser & {
  consumerProfile?: AuthResponse['consumerProfile'];
};

export async function fetchMeRequest(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/auth/me', { method: 'POST' });
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
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
