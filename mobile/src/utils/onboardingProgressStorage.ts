import AsyncStorage from '@react-native-async-storage/async-storage';

import { ONBOARDING_STEPS, type OnboardingStep } from '@/utils/onboardingResume';

const keyFor = (userId: string) => `@mirafood/onboardingReachedStep:${userId}`;

/** Highest onboarding step index the user has opened (0 = intro). */
export async function loadReachedOnboardingStep(userId: string | null | undefined): Promise<number | null> {
  if (!userId) return null;
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (raw == null) return null;
    const value = Number(raw);
    if (!Number.isFinite(value)) return null;
    return Math.max(0, Math.min(Math.floor(value), ONBOARDING_STEPS.length - 1));
  } catch {
    return null;
  }
}

export async function saveReachedOnboardingStep(
  userId: string | null | undefined,
  stepIndex: number,
): Promise<void> {
  if (!userId) return;
  try {
    const previous = (await loadReachedOnboardingStep(userId)) ?? 0;
    const next = Math.max(previous, Math.max(0, Math.min(stepIndex, ONBOARDING_STEPS.length - 1)));
    await AsyncStorage.setItem(keyFor(userId), String(next));
  } catch {
    // Non-blocking.
  }
}

export async function clearReachedOnboardingStep(userId: string | null | undefined): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.removeItem(keyFor(userId));
  } catch {
    // ignore
  }
}

export function stepNameAt(index: number): OnboardingStep {
  return ONBOARDING_STEPS[Math.max(0, Math.min(index, ONBOARDING_STEPS.length - 1))];
}
