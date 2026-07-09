import { mealCoachReviewsRepository } from "./meal-coach-reviews.repository";
import { mealsRepository } from "./meals.repository";
import { coachAssignmentsRepository } from "../coaches/coach-assignments.repository";
import { filterMealsForCoach, resolveCoachCaseloadIds, resolveCoachQueueClientIds } from "./coach-scope.util";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function emptyWeekSeries(): { label: string; value: number }[] {
  const today = new Date();
  const points: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    points.push({ label: WEEKDAY_LABELS[d.getDay()], value: 0 });
  }
  return points;
}

export const coachAnalyticsService = {
  async getAnalytics(coachUserId: string, cohortId?: string) {
    const [allMeals, allReviews, caseloadIds, assignments] = await Promise.all([
      mealsRepository.findAllMeals(),
      mealCoachReviewsRepository.findAll(),
      resolveCoachCaseloadIds(coachUserId, cohortId),
      coachAssignmentsRepository.findByCoachUserId(coachUserId),
    ]);

    const mealMap = new Map(allMeals.map((m) => [m.id, m]));
    const queueClientIds = await resolveCoachQueueClientIds(cohortId);
    const queueMeals = filterMealsForCoach(allMeals, queueClientIds);

    const reviewsThisWeek = emptyWeekSeries();
    const approvalTrend = emptyWeekSeries();
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    const mealTypeCounts: Record<string, number> = {};
    let reviewed = 0;
    let approved = 0;

    const reviews = allReviews.filter((r) => r.coachId === coachUserId);

    for (const review of reviews) {
      reviewed++;
      const meal = mealMap.get(review.mealId);
      if (!meal) continue;

      if (review.action === "approve") {
        approved++;
        mealTypeCounts[meal.mealType] = (mealTypeCounts[meal.mealType] ?? 0) + 1;
      }

      if (review.reviewedAt >= weekStart) {
        const offset = Math.floor(
          (review.reviewedAt.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000),
        );
        if (offset >= 0 && offset < 7) {
          reviewsThisWeek[offset].value += 1;
          if (review.action === "approve") {
            approvalTrend[offset].value += 1;
          }
        }
      }
    }

    const inReview = queueMeals.filter((m) => m.status === "in_review").length;
    const analyzing = queueMeals.filter((m) => m.status === "analyzing").length;
    const approvedTotal = queueMeals.filter((m) => m.status === "approved").length;
    const flagged = queueMeals.filter(
      (m) => m.status === "in_review" && m.data.fraudCheckResult === "flag",
    ).length;

    const durations = reviews
      .map((r) => r.reviewDurationSeconds)
      .filter((v): v is number => typeof v === "number" && v > 0);

    return {
      reviewsThisWeek,
      approvalTrend,
      queueBreakdown: [
        { label: "In review", value: inReview, color: "#ff6f32" },
        { label: "Analyzing", value: analyzing, color: "#023459" },
        { label: "Approved", value: approvedTotal, color: "#1d9e75" },
        { label: "Flagged", value: flagged, color: "#b54e24" },
      ],
      reviewsByMealType: Object.entries(mealTypeCounts).map(([label, value]) => ({
        label,
        value,
      })),
      coachStats: {
        totalReviews: reviewed,
        activeClients: assignments.length || caseloadIds.size,
        approvalRate: reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0,
        avgReviewMinutes:
          durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60)
            : 0,
      },
    };
  },
};
