export type UserRole = 'coach' | 'admin' | 'consumer';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  patientId?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  expiresAt: number;
  onboardingComplete?: boolean;
};

export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type RegisterCredentials = {
  email: string;
  password: string;
  displayName: string;
  rememberMe?: boolean;
};

export type ForgotPasswordPayload = {
  email: string;
};

/** @deprecated Use UserRole */
export type CoachRole = UserRole;
