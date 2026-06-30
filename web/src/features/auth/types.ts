export type CoachRole = 'coach' | 'admin';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: CoachRole;
  avatarUrl?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  expiresAt: number;
};

export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type ForgotPasswordPayload = {
  email: string;
};
