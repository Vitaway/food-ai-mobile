import { AppDataSource } from "../../config/database";
import { ReportSnapshot } from "./report-snapshot.entity";
import { mealsRepository } from "../meals/meals.repository";
import { usersRepository } from "../users/users.repository";
import { mealCoachReviewsRepository } from "../meals/meal-coach-reviews.repository";
import { computeDashboard } from "../consumers/dashboard.util";
import { ConsumerDailyHealthScore } from "../consumers/daily-health-score.entity";
import { coachProfilesRepository } from "../coaches/coach-profiles.repository";

const reportsRepo = AppDataSource.getRepository(ReportSnapshot);
const healthScoreRepo = AppDataSource.getRepository(ConsumerDailyHealthScore);

function range(period: "weekly" | "monthly") {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (period === "weekly" ? 6 : 29));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export const periodRange = range;

function mealsInRange(
  meals: Awaited<ReturnType<typeof mealsRepository.findAllMeals>>,
  start: string,
  end: string,
  clientId?: string,
) {
  return meals.filter((meal) => {
    const day = meal.submittedAt.toISOString().slice(0, 10);
    if (day < start || day > end) return false;
    if (clientId && meal.clientId !== clientId) return false;
    return true;
  });
}

export const reportsService = {
  periodRange: range,

  async generatePlatformSnapshot(period: "weekly" | "monthly") {
    const { start, end } = range(period);
    const meals = await mealsRepository.findAllMeals();
    const consumers = await mealsRepository.findAllConsumers();
    const coaches = await usersRepository.countByRole("coach");
    const periodMeals = mealsInRange(meals, start, end);
    const metrics = {
      period,
      mealCount: periodMeals.length,
      approvedMeals: periodMeals.filter((meal) => meal.status === "approved").length,
      inReviewMeals: periodMeals.filter((meal) => meal.status === "in_review").length,
      clientAdherencePct:
        consumers.length > 0
          ? Math.round(
              (consumers.filter((c) => Number(c.dashboard.streakDays ?? 0) > 0).length /
                consumers.length) *
                100,
            )
          : 0,
      coaches,
      consumers: consumers.length,
      platformUsage: {
        totalMealsLogged: periodMeals.length,
        uniqueClientsLogging: new Set(periodMeals.map((m) => m.clientId)).size,
      },
    };
    const snapshot = reportsRepo.create({
      scopeType: "admin",
      scopeId: "platform",
      period,
      periodStart: start,
      periodEnd: end,
      metrics,
    });
    await reportsRepo.save(snapshot);
    return snapshot;
  },

  async generateConsumerSnapshot(clientId: string, period: "weekly" | "monthly") {
    const { start, end } = range(period);
    const consumer = (await mealsRepository.findAllConsumers()).find((c) => c.id === clientId);
    if (!consumer) return null;

    const meals = await mealsRepository.findMealsByClientId(clientId);
    const reviews = await mealCoachReviewsRepository.findByMealIds(meals.map((m) => m.id));
    const byMealId = new Map(reviews.map((r) => [r.mealId, r]));
    const dashboard = computeDashboard(consumer.profile, consumer.dashboard, meals, byMealId);
    const periodMeals = mealsInRange(meals, start, end, clientId);
    const approved = periodMeals.filter((m) => m.status === "approved");

    const healthScores = await healthScoreRepo.find({
      where: { clientId },
      order: { date: "DESC" },
      take: period === "weekly" ? 7 : 30,
    });

    const metrics = {
      period,
      nutritionSummary: {
        caloriesConsumed: dashboard.caloriesConsumed,
        calorieTarget: dashboard.calorieTarget,
        macrosConsumed: dashboard.macrosConsumed,
      },
      adherence: {
        daysLogged: new Set(approved.map((m) => m.submittedAt.toISOString().slice(0, 10))).size,
        mealsLogged: approved.length,
        streakDays: dashboard.streakDays,
      },
      healthScoreTrend: healthScores.map((row) => ({
        date: row.date,
        totalScore: Number(row.totalScore),
        nutrientScore: Number(row.nutrientScore),
        macroScore: Number(row.macroScore),
        calorieScore: Number(row.calorieScore),
        consistencyScore: Number(row.consistencyScore),
        varietyScore: Number(row.varietyScore),
      })),
      currentHealthScore: dashboard.healthScore,
      healthScoreBreakdown: dashboard.healthScoreBreakdown,
    };

    const snapshot = reportsRepo.create({
      scopeType: "consumer",
      scopeId: clientId,
      period,
      periodStart: start,
      periodEnd: end,
      metrics,
    });
    await reportsRepo.save(snapshot);
    return snapshot;
  },

  async generateAllConsumerSnapshots(period: "weekly" | "monthly") {
    const consumers = await mealsRepository.findAllConsumers();
    const results = [];
    for (const consumer of consumers) {
      const snapshot = await this.generateConsumerSnapshot(consumer.id, period);
      if (snapshot) results.push(snapshot);
    }
    return results;
  },

  async generateCoachSnapshot(coachUserId: string, period: "weekly" | "monthly") {
    const { start, end } = range(period);
    const profile = await coachProfilesRepository.findByUserId(coachUserId);
    const meals = await mealsRepository.findAllMeals();
    const periodMeals = mealsInRange(meals, start, end);
    const reviews = await mealCoachReviewsRepository.findByMealIds(periodMeals.map((m) => m.id));

    const metrics = {
      period,
      coachActivity: {
        reviewsCompleted: reviews.filter((r) => r.action === "approve" || r.action === "reject").length,
        mealsInQueue: periodMeals.filter((m) => m.status === "in_review").length,
        mealsApproved: periodMeals.filter((m) => m.status === "approved").length,
      },
      organization: profile?.organization ?? null,
    };

    const snapshot = reportsRepo.create({
      scopeType: "coach",
      scopeId: coachUserId,
      period,
      periodStart: start,
      periodEnd: end,
      metrics,
    });
    await reportsRepo.save(snapshot);
    return snapshot;
  },

  async generateAllCoachSnapshots(period: "weekly" | "monthly") {
    const coaches = await usersRepository.findByRole("coach");
    const results = [];
    for (const coach of coaches) {
      results.push(await this.generateCoachSnapshot(coach.id, period));
    }
    return results;
  },

  async listForConsumer(scopeId: string) {
    const rows = await reportsRepo.find({
      where: { scopeType: "consumer", scopeId },
      order: { periodEnd: "DESC", createdAt: "DESC" },
      take: 30,
    });
    return rows.map((row) => ({
      id: row.id,
      period: row.period,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      metrics: row.metrics,
      createdAt: row.createdAt.toISOString(),
    }));
  },

  async listForCoach(coachUserId: string) {
    const rows = await reportsRepo.find({
      where: { scopeType: "coach", scopeId: coachUserId },
      order: { periodEnd: "DESC", createdAt: "DESC" },
      take: 30,
    });
    return rows.map((row) => ({
      id: row.id,
      period: row.period,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      metrics: row.metrics,
      createdAt: row.createdAt.toISOString(),
    }));
  },

  async summary() {
    const recent = await reportsRepo.find({
      where: { scopeType: "admin", scopeId: "platform" },
      order: { periodEnd: "DESC" },
      take: 12,
    });
    return {
      count: await reportsRepo.count({ where: { scopeType: "admin", scopeId: "platform" } }),
      snapshots: recent.map((row) => ({
        id: row.id,
        period: row.period,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        metrics: row.metrics,
        createdAt: row.createdAt.toISOString(),
      })),
      latest: recent[0]
        ? {
            id: recent[0].id,
            period: recent[0].period,
            periodStart: recent[0].periodStart,
            periodEnd: recent[0].periodEnd,
            metrics: recent[0].metrics,
            createdAt: recent[0].createdAt.toISOString(),
          }
        : null,
    };
  },
};
