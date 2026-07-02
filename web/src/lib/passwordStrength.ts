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

export function passwordRequirementStatus(password: string) {
  return {
    length: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
  };
}

const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  weak: 'bg-red-500',
  fair: 'bg-cinnamon-wood-400',
  good: 'bg-shamrock-500',
  strong: 'bg-blue-spruce-600',
};

const STRENGTH_WIDTH: Record<PasswordStrength, string> = {
  weak: 'w-1/4',
  fair: 'w-2/4',
  good: 'w-3/4',
  strong: 'w-full',
};

export function strengthBarClass(strength: PasswordStrength) {
  return `${STRENGTH_COLORS[strength]} ${STRENGTH_WIDTH[strength]}`;
}

export function strengthTextClass(strength: PasswordStrength) {
  if (strength === 'weak') return 'text-red-600';
  if (strength === 'fair') return 'text-cinnamon-wood-700';
  if (strength === 'good') return 'text-shamrock-700';
  return 'text-blue-spruce-700';
}
