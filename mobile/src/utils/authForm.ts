import { isPasswordAcceptable } from '@/utils/passwordStrength';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isRegisterFormValid(fields: {
  email: string;
  password: string;
}): boolean {
  return isValidEmail(fields.email) && isPasswordAcceptable(fields.password);
}
