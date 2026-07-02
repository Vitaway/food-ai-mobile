export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak';
  const score = scorePassword(password);
  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
}

export function isPasswordAcceptable(password: string): boolean {
  return password.length >= 8 && scorePassword(password) >= 2;
}

export const PASSWORD_REQUIREMENTS = [
  'At least 8 characters',
  'Mix of upper & lower case letters',
  'At least one number',
] as const;

export function passwordRequirementStatus(password: string) {
  return {
    length: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
  };
}
