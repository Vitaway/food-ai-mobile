import type { MealSubmission } from "./meal-submission.entity";
import type { MealCoachReview } from "./meal-coach-review.entity";
import { asDetectedItems } from "./nutrition.util";
import { waitingMinutes } from "./meal-effective.util";

export const SLA_TARGET_MINUTES = 240;

export type MealComplexity = "simple" | "moderate" | "complex";
export type MealClassificationLabel = "single_item" | "multi_item" | "mixed_dish" | "snack" | "beverage";

export function slaMinutesRemaining(submittedAt: Date, targetMinutes = SLA_TARGET_MINUTES, now = new Date()) {
  const waited = waitingMinutes(submittedAt, now);
  return Math.max(0, targetMinutes - waited);
}

export function deriveMealComplexity(meal: MealSubmission): MealComplexity {
  const items = asDetectedItems(meal.data.items);
  const conf = Number(meal.data.confidenceAvg ?? 1);
  if (items.length <= 1 && conf >= 0.85) return "simple";
  if (items.length <= 2 && conf >= 0.72) return "moderate";
  return "complex";
}

export function deriveClassificationLabel(meal: MealSubmission): MealClassificationLabel {
  const raw = meal.data.mealClassification;
  if (raw === "snack") return "snack";
  if (raw === "beverage") return "beverage";
  const items = asDetectedItems(meal.data.items);
  if (items.length <= 1) return "single_item";
  if (items.length === 2) return "multi_item";
  return "mixed_dish";
}

function normalizeItemKey(item: ReturnType<typeof asDetectedItems>[number]) {
  return `${item.label.trim().toLowerCase()}|${Math.round(item.estimatedWeightG)}`;
}

export function reviewWasCorrected(meal: MealSubmission, review: MealCoachReview): boolean {
  if (review.action !== "approve") return false;
  const aiItems = asDetectedItems(meal.data.items);
  const coachItems = review.items ? asDetectedItems(review.items) : [];
  if (aiItems.length !== coachItems.length) return true;
  const aiKeys = aiItems.map(normalizeItemKey).sort();
  const coachKeys = coachItems.map(normalizeItemKey).sort();
  return aiKeys.some((key, idx) => key !== coachKeys[idx]);
}

export function mealWasAutoApproved(meal: MealSubmission): boolean {
  return meal.data.autoApproved === true;
}
