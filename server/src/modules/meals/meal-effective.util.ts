import type { MealSubmission } from "./meal-submission.entity";
import type { MealCoachReview } from "./meal-coach-review.entity";
import { asDetectedItems, sumNutrition } from "./nutrition.util";
import { honestyFromMealData } from "./meal-honesty.util";

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
  const assistRaw = meal.data.assistAnalysis;
  const assistAnalysis =
    assistRaw && typeof assistRaw === "object"
      ? {
          mealName: (assistRaw as { mealName?: string }).mealName,
          items: asDetectedItems((assistRaw as { items?: unknown }).items),
          totalNutrition: (assistRaw as { totalNutrition?: Record<string, number> })
            .totalNutrition,
        }
      : null;

  // Coach-first: patient submission stubs are never an "AI analysis".
  // Only an explicit coach "Ask AI" result (assistAnalysis) counts.
  const awaitingCoachConfirm = meal.status === "in_review" && !review;
  const clientTitle =
    (typeof meal.data.mealName === "string" && meal.data.mealName.trim()) ||
    (typeof meal.data.note === "string" && meal.data.note.trim()) ||
    (typeof meal.data.textInput === "string" && meal.data.textInput.trim()) ||
    undefined;

  return {
    id: meal.id,
    clientId: meal.clientId,
    mealType: meal.mealType,
    status: meal.status,
    submittedAt: meal.submittedAt.toISOString(),
    imageUrl: sanitizeImageUrl(meal.data.imageUrl),
    thumbnailUrl:
      sanitizeImageUrl(meal.data.thumbnailUrl) ?? sanitizeImageUrl(meal.data.imageUrl),
    textInput: meal.data.textInput as string | undefined,
    note: meal.data.note as string | undefined,
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
    mealName: awaitingCoachConfirm ? clientTitle : effective.mealName,
    items: awaitingCoachConfirm ? [] : effective.items,
    totalNutrition: awaitingCoachConfirm ? undefined : effective.totalNutrition,
    coachReview: effective.coachReview,
    aiAnalysis: assistAnalysis?.items?.length ? assistAnalysis : undefined,
    assistAnalysis: assistAnalysis?.items?.length ? assistAnalysis : undefined,
  };
}

export function mealToConsumerDto(
  meal: MealSubmission,
  review: MealCoachReview | null | undefined,
) {
  const effective = effectiveMealFields(meal, review);
  const awaitingCoach = meal.status === "in_review";
  const honesty = honestyFromMealData(meal.data, {
    mealType: meal.mealType,
    status: meal.status,
  });
  // Prefer AI dish title over raw note. Show estimate nutrition when items exist.
  const mealName = awaitingCoach
    ? ((typeof meal.data.mealName === "string" ? meal.data.mealName.trim() : "") ||
        (meal.data.note as string | undefined)?.trim() ||
        (meal.data.textInput as string | undefined)?.trim() ||
        "Meal")
    : effective.mealName;

  const items = honesty.items.length ? honesty.items : effective.items;
  const hasEstimateNutrition = items.length > 0;
  const hideStubNutrition = awaitingCoach && !hasEstimateNutrition;
  const totalNutrition =
    effective.totalNutrition ?? (items.length ? sumNutrition(items) : undefined);

  return {
    id: meal.id,
    clientId: meal.clientId,
    mealType: meal.mealType,
    status: meal.status,
    submittedAt: meal.submittedAt.toISOString(),
    imageUrl: sanitizeImageUrl(meal.data.imageUrl),
    thumbnailUrl:
      sanitizeImageUrl(meal.data.thumbnailUrl) ?? sanitizeImageUrl(meal.data.imageUrl),
    textInput: meal.data.textInput as string | undefined,
    note: meal.data.note as string | undefined,
    mealName,
    items: hideStubNutrition ? [] : items,
    totalNutrition: hideStubNutrition ? undefined : totalNutrition,
    confidenceAvg: hideStubNutrition
      ? undefined
      : (meal.data.confidenceAvg as number | undefined),
    healthFlag: hideStubNutrition ? undefined : (meal.data.healthFlag as string | undefined),
    healthMessage: awaitingCoach
      ? hasEstimateNutrition
        ? "Estimate until your coach confirms — numbers may change."
        : "Your coach is reviewing this meal."
      : (meal.data.healthMessage as string | undefined),
    petals: hideStubNutrition ? undefined : meal.data.petals,
    fraudCheckResult: meal.data.fraudCheckResult,
    mealClassification: meal.data.mealClassification,
    modelVersion: meal.data.modelVersion,
    autoApproved: meal.data.autoApproved,
    manualReviewRequired: meal.data.manualReviewRequired,
    manualReviewReason: meal.data.manualReviewReason,
    coachReview: awaitingCoach ? undefined : effective.coachReview,
    logSource: honesty.logSource,
    balancedPlate: hideStubNutrition ? null : honesty.balancedPlate,
    estimateRange: hideStubNutrition || meal.status === "approved" ? null : honesty.estimateRange,
  };
}

export function waitingMinutes(submittedAt: Date, now = new Date()) {
  return Math.max(0, Math.round((now.getTime() - submittedAt.getTime()) / 60_000));
}
