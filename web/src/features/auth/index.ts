export type {
  AuthSession,
  AuthUser,
  CoachRole,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterCredentials,
  UserRole,
} from './types';
export {
  AUTH_STORAGE_KEY,
  AUTH_ROUTES,
  COACH_ROUTES,
  ADMIN_ROUTES,
  CONSUMER_ROUTES,
} from './constants';
export {
  AuthError,
  login,
  register,
  loginCoach,
  logoutCoach,
  requestPasswordReset,
  verifyResetCode,
  resetPasswordWithOtp,
} from './api/authApi';
export { useAuth } from './hooks/useAuth';
export { useLogin, getLoginErrorMessage } from './hooks/useLogin';
export { useRegister, getRegisterErrorMessage } from './hooks/useRegister';
export { useForgotPassword, getForgotPasswordErrorMessage } from './hooks/useForgotPassword';
export {
  useAuthStore,
  selectAuthUser,
  selectIsAuthenticated,
  selectIsCoach,
  selectIsAdmin,
  selectIsConsumer,
} from './stores/authStore';
export { AuthLayout } from './components/AuthLayout';
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { ProtectedRoute } from './components/ProtectedRoute';
export { GuestRoute } from './components/GuestRoute';
