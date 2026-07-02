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
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      ...(referralCode?.trim() ? { referralCode: referralCode.trim().toUpperCase() } : {}),
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

export async function resetPasswordWithToken(token: string, password: string): Promise<void> {
  await apiRequest<{ ok: boolean }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}
