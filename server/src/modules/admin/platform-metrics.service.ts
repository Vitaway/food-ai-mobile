import { AppDataSource } from "../../config/database";
import { User } from "../users/user.entity";
import { usersRepository } from "../users/users.repository";
import { mealsRepository } from "../meals/meals.repository";
import { mealCoachReviewsRepository } from "../meals/meal-coach-reviews.repository";
import { coachAssignmentsRepository } from "../coaches/coach-assignments.repository";
import { coachProfilesRepository } from "../coaches/coach-profiles.repository";
import { waitingMinutes } from "../meals/meal-effective.util";
import { mealWasAutoApproved, reviewWasCorrected, SLA_TARGET_MINUTES } from "../meals/meal-metrics.util";


function pct(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export const platformMetricsService = {
  async getAdminOperations() {
    const [meals, reviews, coaches, consumers] = await Promise.all([
      mealsRepository.findAllMeals(),
      mealCoachReviewsRepository.findAll(),
      usersRepository.findByRole("coach"),
      mealsRepository.findAllConsumers(),
    ]);

    const mealMap = new Map(meals.map((m) => [m.id, m]));
    const approvedMeals = meals.filter((m) => m.status === "approved");
    const autoApproved = approvedMeals.filter(mealWasAutoApproved).length;
    const autoApprovalRate = pct(autoApproved, approvedMeals.length);

    const approveReviews = reviews.filter((r) => r.action === "approve");
    const corrected = approveReviews.filter((r) => {
      const meal = mealMap.get(r.mealId);
      return meal ? reviewWasCorrected(meal, r) : false;
    }).length;
    const correctionRate = pct(corrected, approveReviews.length);

    const turnaroundMinutes: number[] = [];
    for (const review of approveReviews) {
      const meal = mealMap.get(review.mealId);
      if (!meal) continue;
      const mins = waitingMinutes(meal.submittedAt, review.reviewedAt);
      turnaroundMinutes.push(mins);
    }
    const avgTurnaroundHours =
      turnaroundMinutes.length > 0
        ? Math.round((turnaroundMinutes.reduce((a, b) => a + b, 0) / turnaroundMinutes.length / 60) * 10) / 10
        : 0;

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const userRepo = AppDataSource.getRepository(User);
    const activeUsers = await userRepo
      .createQueryBuilder("u")
      .where("u.created_at >= :monthAgo", { monthAgo })
      .getCount();
    const totalUsers = await userRepo.count();
    const prevMonthStart = new Date();
    prevMonthStart.setDate(prevMonthStart.getDate() - 60);
    const prevMonthUsers = await userRepo
      .createQueryBuilder("u")
      .where("u.created_at >= :start AND u.created_at < :end", {
        start: prevMonthStart,
        end: monthAgo,
      })
      .getCount();
    const activeUsersGrowth =
      prevMonthUsers > 0 ? Math.round(((activeUsers - prevMonthUsers) / prevMonthUsers) * 1000) / 10 : 0;

    const assignments = await coachAssignmentsRepository.findAll();
    const inReview = meals.filter((m) => m.status === "in_review");
    const coachUtilization = await Promise.all(
      coaches.map(async (coach) => {
        const clientIds = assignments.filter((a) => a.coachUserId === coach.id).map((a) => a.clientId);
        const queueCount = inReview.filter((m) => clientIds.includes(m.clientId)).length;
        const capacity = Math.max(clientIds.length, 1);
        const utilization = Math.min(100, Math.round((queueCount / capacity) * 100));
        const profile = await coachProfilesRepository.findByUserId(coach.id);
        return {
          coachId: coach.id,
          displayName: coach.displayName,
          email: coach.email,
          assignedClients: clientIds.length,
          queueCount,
          utilization,
          title: profile?.title ?? null,
        };
      }),
    );

    const trendBuckets = new Map<string, { approved: number; autoApproved: number }>();
    for (let i = 3; i >= 0; i -= 1) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const key = `Week ${4 - i}`;
      trendBuckets.set(key, { approved: 0, autoApproved: 0 });
      for (const meal of approvedMeals) {
        if (meal.submittedAt >= start && meal.submittedAt < end) {
          const bucket = trendBuckets.get(key)!;
          bucket.approved += 1;
          if (mealWasAutoApproved(meal)) bucket.autoApproved += 1;
        }
      }
    }
    const autoApprovalTrend = [...trendBuckets.entries()].map(([label, bucket]) => ({
      label,
      rate: pct(bucket.autoApproved, bucket.approved),
      approved: bucket.approved,
    }));

    return {
      activeUsers: totalUsers,
      activeUsersGrowth,
      autoApprovalRate,
      correctionRate,
      avgTurnaroundHours,
      slaTargetHours: SLA_TARGET_MINUTES / 60,
      coachUtilization,
      autoApprovalTrend,
      consumers: consumers.length,
      mealsInReview: inReview.length,
    };
  },

  async getCoachRoster() {
    const [coaches, meals, reviews, assignments] = await Promise.all([
      usersRepository.findByRole("coach"),
      mealsRepository.findAllMeals(),
      mealCoachReviewsRepository.findAll(),
      coachAssignmentsRepository.findAll(),
    ]);
    const mealMap = new Map(meals.map((m) => [m.id, m]));

    return Promise.all(
      coaches.map(async (coach) => {
        const clientIds = assignments.filter((a) => a.coachUserId === coach.id).map((a) => a.clientId);
        const coachReviews = reviews.filter((r) => r.coachId === coach.id && r.action === "approve");
        const corrected = coachReviews.filter((r) => {
          const meal = mealMap.get(r.mealId);
          return meal ? reviewWasCorrected(meal, r) : false;
        }).length;
        const durations = coachReviews
          .map((r) => r.reviewDurationSeconds)
          .filter((v): v is number => typeof v === "number" && v > 0);
        const profile = await coachProfilesRepository.findByUserId(coach.id);
        return {
          id: coach.id,
          email: coach.email,
          displayName: coach.displayName,
          isActive: coach.isActive,
          role: profile?.title ?? "Nutrition coach",
          assignedClients: clientIds.length,
          correctionRate: pct(corrected, coachReviews.length),
          avgTurnaroundHours:
            durations.length > 0
              ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length / 3600) * 10) / 10
              : 0,
          organization: profile?.organization ?? null,
        };
      }),
    );
  },

  async getCoachOperations(coachUserId: string) {
    const [meals, reviews] = await Promise.all([
      mealsRepository.findAllMeals(),
      mealCoachReviewsRepository.findAll(),
    ]);
    const mealMap = new Map(meals.map((m) => [m.id, m]));
    const coachReviews = reviews.filter((r) => r.coachId === coachUserId);
    const approveReviews = coachReviews.filter((r) => r.action === "approve");
    const corrected = approveReviews.filter((r) => {
      const meal = mealMap.get(r.mealId);
      return meal ? reviewWasCorrected(meal, r) : false;
    }).length;

    const today = new Date().toISOString().slice(0, 10);
    const approvedToday = approveReviews.filter((r) => r.reviewedAt.toISOString().slice(0, 10) === today);
    const autoApprovedToday = approvedToday.filter((r) => {
      const meal = mealMap.get(r.mealId);
      return meal ? mealWasAutoApproved(meal) : false;
    }).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const approvedWeek = approveReviews.filter((r) => r.reviewedAt >= weekAgo);
    const autoApprovedWeek = approvedWeek.filter((r) => {
      const meal = mealMap.get(r.mealId);
      return meal ? mealWasAutoApproved(meal) : false;
    }).length;

    const durations = coachReviews
      .map((r) => r.reviewDurationSeconds)
      .filter((v): v is number => typeof v === "number" && v > 0);

    const inReview = meals.filter((m) => m.status === "in_review");
    const nearSla = inReview.filter((m) => waitingMinutes(m.submittedAt) >= SLA_TARGET_MINUTES * 0.75).length;

    return {
      correctionRate: pct(corrected, approveReviews.length),
      autoApprovalRateToday: pct(autoApprovedToday, approvedToday.length),
      autoApprovalRateWeek: pct(autoApprovedWeek, approvedWeek.length),
      avgTurnaroundHours:
        durations.length > 0
          ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length / 3600) * 10) / 10
          : 0,
      pendingReview: inReview.length,
      nearSla,
      slaOnTrack: nearSla === 0,
    };
  },
};
