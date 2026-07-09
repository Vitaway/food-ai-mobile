import type { UserProfile } from '@/types';

type ProfileLike = Partial<UserProfile> | Record<string, unknown>;

/** True when health targets were saved — even if onboardingComplete was never persisted. */
export function deriveOnboardingComplete(profile: ProfileLike | null | undefined): boolean {
  if (!profile || typeof profile !== 'object') return false;
  if (profile.onboardingComplete === true) return true;

  const age = profile.age;
  const heightCm = profile.heightCm;
  const weightKg = profile.weightKg;
  const goal = profile.goal;
  const activityLevel = profile.activityLevel;
  const bmr = profile.bmr;
  const macros = profile.macroTargets as { calories?: unknown; caloriesKcal?: unknown } | undefined;

  const hasHealthBasics =
    typeof age === 'number' &&
    age > 0 &&
    typeof heightCm === 'number' &&
    heightCm > 0 &&
    typeof weightKg === 'number' &&
    weightKg > 0 &&
    typeof goal === 'string' &&
    goal.length > 0 &&
    typeof activityLevel === 'string' &&
    activityLevel.length > 0;

  const calories =
    typeof macros?.calories === 'number'
      ? macros.calories
      : typeof macros?.caloriesKcal === 'number'
        ? macros.caloriesKcal
        : 0;

  const hasComputedTargets = typeof bmr === 'number' && bmr > 0 && calories > 0;

  return hasHealthBasics && hasComputedTargets;
}

export function resolveOnboardingComplete(profile: ProfileLike | null | undefined): boolean {
  return deriveOnboardingComplete(profile);
}
