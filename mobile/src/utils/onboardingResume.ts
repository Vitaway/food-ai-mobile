import type { UserProfile } from '@/types';
import { isValidDateOfBirth } from '@/utils/dateOfBirth';

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

function stepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

/** Progress from furthest step reached (high-water mark). Intro = 0%, last step = 100%. */
export function onboardingStepPercent(reachedStepIndex: number, totalSteps = ONBOARDING_STEPS.length): number {
  if (totalSteps <= 1) return 0;
  const last = totalSteps - 1;
  const clamped = Math.max(0, Math.min(reachedStepIndex, last));
  return Math.round((clamped / last) * 100);
}

type ProfileLike = Partial<UserProfile> | null | undefined;

/**
 * First incomplete step when reopening onboarding.
 * After body metrics, only advances when later fields were actually saved
 * (target weight is the signal that the user left the goals/target stretch).
 */
export function getResumeOnboardingStepIndex(profile: ProfileLike): number {
  if (!profile) return 0;

  const hasName = (profile.displayName ?? '').trim().length >= 2;
  const hasDob = typeof profile.dateOfBirth === 'string' && isValidDateOfBirth(profile.dateOfBirth);
  const hasSex = profile.sex != null;
  const hasBody =
    typeof profile.heightCm === 'number' &&
    profile.heightCm >= 120 &&
    typeof profile.weightKg === 'number' &&
    profile.weightKg >= 35;
  const hasTarget =
    typeof profile.targetWeightKg === 'number' && profile.targetWeightKg >= 35;
  const hasActivity = typeof profile.activityLevel === 'string' && profile.activityLevel.length > 0;
  const hasMeals =
    typeof profile.mealsPerDay === 'number' && profile.mealsPerDay >= 1 && profile.mealsPerDay <= 12;

  // No health progress yet — always show the achievement intro.
  if (!hasDob && !hasSex && !hasBody) return 0;

  if (!hasName) return stepIndex('photo');
  if (!hasDob) return stepIndex('profile');
  if (!hasSex) return stepIndex('sex');
  if (!hasBody) return stepIndex('body');
  // Do not skip goals just because a default goal string exists on the profile.
  if (!hasTarget) return stepIndex('goals');
  if (!hasActivity) return stepIndex('activity');
  if (!hasMeals) return stepIndex('habits');
  return stepIndex('summary');
}

/** First step index when opening onboarding (before profile hydrate). */
export function getInitialOnboardingStepIndex(_opts?: {
  isAuthenticated: boolean;
  profile?: ProfileLike;
}): number {
  if (_opts?.profile) return getResumeOnboardingStepIndex(_opts.profile);
  return 0;
}

export function getMinimumOnboardingStepIndex(_isAuthenticated?: boolean): number {
  return 0;
}
