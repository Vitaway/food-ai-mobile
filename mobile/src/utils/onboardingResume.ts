export const ONBOARDING_STEPS = [
  'intro',
  'photo',
  'profile',
  'sex',
  'body',
  'goals',
  'target',
  'activity',
  'habits',
  'preferences',
  'allergies',
  'summary',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** First step index when opening onboarding (skip intro for returning logged-in users). */
export function getInitialOnboardingStepIndex(opts: { isAuthenticated: boolean }): number {
  return opts.isAuthenticated ? ONBOARDING_STEPS.indexOf('photo') : 0;
}

export function getMinimumOnboardingStepIndex(isAuthenticated: boolean): number {
  return isAuthenticated ? ONBOARDING_STEPS.indexOf('photo') : 0;
}
