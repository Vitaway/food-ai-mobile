type ConsumerProfileJson = Record<string, unknown>;

/** True when the stored health profile clearly finished setup (even if the flag was never saved). */
export function deriveOnboardingComplete(profile: ConsumerProfileJson | null | undefined): boolean {
  if (!profile || typeof profile !== "object") return false;

  // Explicit false = still in onboarding (draft saves). Do not auto-complete.
  if (profile.onboardingComplete === false) return false;
  if (profile.onboardingComplete === true) return true;

  const age = profile.age;
  const heightCm = profile.heightCm;
  const weightKg = profile.weightKg;
  const goal = profile.goal;
  const activityLevel = profile.activityLevel;
  const bmr = profile.bmr;
  const macros = profile.macroTargets as { calories?: unknown; caloriesKcal?: unknown } | undefined;
  const calculation = profile.nutritionCalculation as { nceVersion?: unknown } | undefined;

  const hasHealthBasics =
    typeof age === "number" &&
    age > 0 &&
    typeof heightCm === "number" &&
    heightCm > 0 &&
    typeof weightKg === "number" &&
    weightKg > 0 &&
    typeof goal === "string" &&
    goal.length > 0 &&
    typeof activityLevel === "string" &&
    activityLevel.length > 0;

  const calories =
    typeof macros?.calories === "number"
      ? macros.calories
      : typeof macros?.caloriesKcal === "number"
        ? macros.caloriesKcal
        : 0;

  const hasComputedTargets =
    typeof bmr === "number" &&
    bmr > 0 &&
    calories > 0 &&
    typeof calculation?.nceVersion === "string";

  return hasHealthBasics && hasComputedTargets;
}

export function resolveOnboardingComplete(profile: ConsumerProfileJson | null | undefined): boolean {
  return deriveOnboardingComplete(profile);
}

/** Persist the flag when legacy profiles already contain a full health setup. */
export async function backfillOnboardingComplete(
  profile: ConsumerProfileJson,
  save: (next: ConsumerProfileJson) => Promise<void>,
): Promise<ConsumerProfileJson> {
  // Never override an explicit in-progress draft.
  if (profile.onboardingComplete === false || profile.onboardingComplete === true) {
    return profile;
  }
  if (!deriveOnboardingComplete(profile)) {
    return profile;
  }

  const next = { ...profile, onboardingComplete: true };
  await save(next);
  return next;
}
