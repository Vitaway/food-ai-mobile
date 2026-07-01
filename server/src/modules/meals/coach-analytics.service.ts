import { mealsRepository } from "./meals.repository";

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

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const coachAnalyticsService = {
  async getAnalytics() {
    const meals = await mealsRepository.findAllMeals();
    const consumers = await mealsRepository.findAllConsumers();

    const reviewsThisWeek = emptyWeekSeries();
    const approvalTrend = emptyWeekSeries();
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    const mealTypeCounts: Record<string, number> = {};
    let reviewed = 0;
    let approved = 0;

    for (const meal of meals) {
      if (meal.status === "approved" || meal.status === "rejected") {
        reviewed++;
        if (meal.status === "approved") {
          approved++;
          mealTypeCounts[meal.mealType] = (mealTypeCounts[meal.mealType] ?? 0) + 1;
        }

        const reviewAt = meal.data.coachReview as { reviewedAt?: string } | undefined;
        const reviewedAt = reviewAt?.reviewedAt
          ? new Date(reviewAt.reviewedAt)
          : meal.submittedAt;
        if (reviewedAt >= weekStart) {
          const offset = Math.floor(
            (reviewedAt.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000),
          );
          if (offset >= 0 && offset < 7) {
            reviewsThisWeek[offset].value += 1;
            if (meal.status === "approved") {
              approvalTrend[offset].value += 1;
            }
          }
        }
      }
    }

    const inReview = meals.filter((m) => m.status === "in_review").length;
    const analyzing = meals.filter((m) => m.status === "analyzing").length;
    const approvedTotal = meals.filter((m) => m.status === "approved").length;
    const flagged = meals.filter(
      (m) => m.status === "in_review" && m.data.fraudCheckResult === "flag",
    ).length;

    const clientIds = new Set(meals.map((m) => m.clientId));

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
        activeClients: clientIds.size || consumers.length,
        approvalRate: reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0,
        avgReviewMinutes: 0,
      },
    };
  },
};
