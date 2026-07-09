import type { MealSubmission } from "./meal-submission.entity";
import type { MealCoachReview } from "./meal-coach-review.entity";
import { asDetectedItems, sumNutrition } from "./nutrition.util";

function sanitizeImageUrl(url: unknown): string | undefined {
  if (typeof url !== "string" || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith("file:") || trimmed.startsWith("content:")) return undefined;
  return trimmed;
}

export type MealCoachReviewDto = {
  id: string;
  mealId: string;
  coachId: string;
  action: "approve" | "reject";
  note?: string;
  trainingNote?: string;
  mealName?: string;
  items?: ReturnType<typeof asDetectedItems>;
  totalNutrition?: Record<string, number>;
  reviewDurationSeconds?: number;
  reviewedAt: string;
};

export function reviewToDto(review: MealCoachReview): MealCoachReviewDto {
  return {
    id: review.id,
    mealId: review.mealId,
    coachId: review.coachId,
    action: review.action,
    note: review.note ?? undefined,
    trainingNote: review.trainingNote ?? undefined,
    mealName: review.mealName ?? undefined,
    items: review.items ? asDetectedItems(review.items) : undefined,
    totalNutrition: review.totalNutrition ?? undefined,
    reviewDurationSeconds: review.reviewDurationSeconds ?? undefined,
    reviewedAt: review.reviewedAt.toISOString(),
  };
}

export function extractAiAnalysis(data: Record<string, unknown>) {
  return {
    mealName: (data.mealName as string | undefined) ?? undefined,
    items: asDetectedItems(data.items),
    totalNutrition: data.totalNutrition as Record<string, number> | undefined,
    confidenceAvg: data.confidenceAvg as number | undefined,
    healthFlag: data.healthFlag as string | undefined,
    healthMessage: data.healthMessage as string | undefined,
  };
}

/** Approved diary values come from coach review; original AI snapshot stays in meal.data */
export function effectiveMealFields(
  meal: MealSubmission,
  review: MealCoachReview | null | undefined,
) {
  const ai = extractAiAnalysis(meal.data);
  if (meal.status === "approved" && review?.action === "approve") {
    const items = review.items ? asDetectedItems(review.items) : ai.items;
    const totalNutrition =
      review.totalNutrition ??
      (items.length ? sumNutrition(items) : ai.totalNutrition);
    return {
      mealName: review.mealName ?? ai.mealName,
      items,
      totalNutrition,
      coachReview: reviewToDto(review),
      aiAnalysis: ai,
    };
  }

  const legacyReview = meal.data.coachReview as
    | { coachId?: string; note?: string; reviewedAt?: string }
    | undefined;

  return {
    mealName: ai.mealName,
    items: ai.items,
    totalNutrition: ai.totalNutrition,
    coachReview: legacyReview
      ? {
          coachId: legacyReview.coachId,
          note: legacyReview.note,
          reviewedAt: legacyReview.reviewedAt,
        }
      : review
        ? reviewToDto(review)
        : undefined,
    aiAnalysis: ai,
  };
}

export function mealToCoachDto(
  meal: MealSubmission,
  review: MealCoachReview | null | undefined,
) {
  const effective = effectiveMealFields(meal, review);
  return {
    id: meal.id,
    clientId: meal.clientId,
    mealType: meal.mealType,
    status: meal.status,
    submittedAt: meal.submittedAt.toISOString(),
    imageUrl: sanitizeImageUrl(meal.data.imageUrl),
    textInput: meal.data.textInput as string | undefined,
    note: meal.data.note as string | undefined,
    plateDiameterCm: meal.data.plateDiameterCm as number | null | undefined,
    confidenceAvg: meal.data.confidenceAvg as number | undefined,
    healthFlag: meal.data.healthFlag as string | undefined,
    healthMessage: meal.data.healthMessage as string | undefined,
    petals: meal.data.petals,
    fraudCheckResult: meal.data.fraudCheckResult,
    mealClassification: meal.data.mealClassification,
    modelVersion: meal.data.modelVersion,
    autoApproved: meal.data.autoApproved,
    manualReviewRequired: meal.data.manualReviewRequired,
    manualReviewReason: meal.data.manualReviewReason,
    ...effective,
  };
}

export function mealToConsumerDto(
  meal: MealSubmission,
  review: MealCoachReview | null | undefined,
) {
  const effective = effectiveMealFields(meal, review);
  return {
    id: meal.id,
    clientId: meal.clientId,
    mealType: meal.mealType,
    status: meal.status,
    submittedAt: meal.submittedAt.toISOString(),
    imageUrl: sanitizeImageUrl(meal.data.imageUrl),
    textInput: meal.data.textInput as string | undefined,
    note: meal.data.note as string | undefined,
    plateDiameterCm: meal.data.plateDiameterCm as number | null | undefined,
    mealName: effective.mealName,
    items: effective.items,
    totalNutrition: effective.totalNutrition,
    confidenceAvg: meal.data.confidenceAvg as number | undefined,
    healthFlag: meal.data.healthFlag as string | undefined,
    healthMessage: meal.data.healthMessage as string | undefined,
    petals: meal.data.petals,
    fraudCheckResult: meal.data.fraudCheckResult,
    mealClassification: meal.data.mealClassification,
    modelVersion: meal.data.modelVersion,
    autoApproved: meal.data.autoApproved,
    manualReviewRequired: meal.data.manualReviewRequired,
    manualReviewReason: meal.data.manualReviewReason,
    coachReview: effective.coachReview,
  };
}

export function waitingMinutes(submittedAt: Date, now = new Date()) {
  return Math.max(0, Math.round((now.getTime() - submittedAt.getTime()) / 60_000));
}
