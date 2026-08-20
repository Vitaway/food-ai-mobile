export const MOBILE_CONSUMER_ROLES = new Set(['consumer']);
export const MOBILE_COACH_ROLES = new Set(['coach', 'nutrition_coach']);
export const MOBILE_ALLOWED_ROLES = new Set([...MOBILE_CONSUMER_ROLES, ...MOBILE_COACH_ROLES]);

export function isCoachRole(role?: string | null) {
  return Boolean(role && MOBILE_COACH_ROLES.has(role));
}

export function isConsumerRole(role?: string | null) {
  return Boolean(role && MOBILE_CONSUMER_ROLES.has(role));
}

export function isMobileAllowedRole(role?: string | null) {
  return Boolean(role && MOBILE_ALLOWED_ROLES.has(role));
}
