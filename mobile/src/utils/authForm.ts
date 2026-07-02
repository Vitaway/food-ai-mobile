import { isPasswordAcceptable } from '@/utils/passwordStrength';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isRegisterFormValid(fields: {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): boolean {
  return (
    fields.displayName.trim().length > 0 &&
    isValidEmail(fields.email) &&
    isPasswordAcceptable(fields.password) &&
    fields.confirmPassword.length > 0 &&
    fields.password === fields.confirmPassword
  );
}
