type MealData = Record<string, unknown>;

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function hasNonZeroNutrition(data: MealData): boolean {
  const total = data.totalNutrition as Record<string, unknown> | undefined;
  const calories = numberOrZero(total?.caloriesKcal);
  const protein = numberOrZero(total?.proteinG);
  const carbs = numberOrZero(total?.carbsG);
  const fat = numberOrZero(total?.fatG);
  return calories > 0 || protein > 0 || carbs > 0 || fat > 0;
}

function hasDetectedItems(data: MealData): boolean {
  return Array.isArray(data.items) && data.items.length > 0;
}

/**
 * Marks submissions that reached the API without usable AI nutrition output.
 * The meal is still accepted, but coaches can prioritize it for manual review.
 */
export function annotateManualReviewFallback(data: MealData): MealData {
  const next = { ...data };
  const preflagged = next.manualReviewRequired === true;
  const hasAiOutput = hasDetectedItems(next) && hasNonZeroNutrition(next);

  if (!hasAiOutput || preflagged) {
    next.manualReviewRequired = true;
    if (typeof next.manualReviewReason !== "string" || !next.manualReviewReason.trim()) {
      next.manualReviewReason = "ai_unavailable";
    }
  }

  return next;
}
