import { BadRequestError } from "routing-controllers";
import { AppDataSource } from "../../config/database";
import { ReportSnapshot, type ReportPeriod } from "./report-snapshot.entity";
import { mealsRepository } from "../meals/meals.repository";
import { usersRepository } from "../users/users.repository";
import { mealCoachReviewsRepository } from "../meals/meal-coach-reviews.repository";
import { computeDashboard } from "../consumers/dashboard.util";
import { ConsumerDailyHealthScore } from "../consumers/daily-health-score.entity";
import { coachProfilesRepository } from "../coaches/coach-profiles.repository";

const reportsRepo = AppDataSource.getRepository(ReportSnapshot);
const healthScoreRepo = AppDataSource.getRepository(ConsumerDailyHealthScore);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

export type ReportRangeInput = {
  period?: ReportPeriod;
  from?: string;
  to?: string;
};

function rollingRange(period: "weekly" | "monthly") {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (period === "weekly" ? 6 : 29));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function daysInclusive(start: string, end: string): number {
  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  const endMs = Date.parse(`${end}T00:00:00.000Z`);
  return Math.floor((endMs - startMs) / 86_400_000) + 1;
}

export function resolveReportRange(input: ReportRangeInput = {}): {
  start: string;
  end: string;
  period: ReportPeriod;
} {
  const { from, to, period } = input;

  if (from || to || period === "custom") {
    if (!from || !to) {
      throw new BadRequestError("Both from and to dates are required (YYYY-MM-DD)");
    }
    if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
      throw new BadRequestError("Dates must be YYYY-MM-DD");
    }
    if (from > to) {
      throw new BadRequestError("from must be on or before to");
    }
    if (daysInclusive(from, to) > MAX_RANGE_DAYS) {
      throw new BadRequestError(`Date range cannot exceed ${MAX_RANGE_DAYS} days`);
    }
    const labeled =
      period === "weekly" || period === "monthly" || period === "custom" ? period : "custom";
    return { start: from, end: to, period: labeled };
  }

  const p = period === "monthly" ? "monthly" : "weekly";
  const { start, end } = rollingRange(p);
  return { start, end, period: p };
}

function range(period: "weekly" | "monthly") {
  return rollingRange(period);
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

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export const reportsService = {
  periodRange: range,
  resolveReportRange,

  async generatePlatformSnapshot(input: ReportRangeInput | "weekly" | "monthly" = "weekly") {
    const rangeInput: ReportRangeInput = typeof input === "string" ? { period: input } : input;
    const { start, end, period } = resolveReportRange(rangeInput);
    const meals = await mealsRepository.findAllMeals();
    const consumers = await mealsRepository.findAllConsumers();
    const coaches = await usersRepository.countByRole("coach");
    const periodMeals = mealsInRange(meals, start, end);
    const approvedMeals = periodMeals.filter((meal) => meal.status === "approved").length;
    const inReviewMeals = periodMeals.filter((meal) => meal.status === "in_review").length;
    const rejectedMeals = periodMeals.filter((meal) => meal.status === "rejected").length;
    const daysInPeriod = daysInclusive(start, end);
    const uniqueClientsLogging = new Set(periodMeals.map((m) => m.clientId)).size;
    const metrics = {
      period,
      mealCount: periodMeals.length,
      approvedMeals,
      inReviewMeals,
      rejectedMeals,
      approvalRatePct: pct(approvedMeals, periodMeals.length),
      daysInPeriod,
      avgMealsPerDay: daysInPeriod > 0 ? Number((periodMeals.length / daysInPeriod).toFixed(1)) : 0,
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
        uniqueClientsLogging,
        activeClientSharePct: pct(uniqueClientsLogging, consumers.length),
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

  async generateConsumerSnapshot(
    clientId: string,
    input: ReportRangeInput | "weekly" | "monthly" = "weekly",
  ) {
    const rangeInput: ReportRangeInput = typeof input === "string" ? { period: input } : input;
    const { start, end, period } = resolveReportRange(rangeInput);
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
    });
    const periodHealthScores = healthScores.filter((row) => row.date >= start && row.date <= end);

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
      healthScoreTrend: periodHealthScores.map((row) => ({
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

  async generateAllConsumerSnapshots(input: ReportRangeInput | "weekly" | "monthly" = "weekly") {
    const consumers = await mealsRepository.findAllConsumers();
    const results = [];
    for (const consumer of consumers) {
      const snapshot = await this.generateConsumerSnapshot(consumer.id, input);
      if (snapshot) results.push(snapshot);
    }
    return results;
  },

  async generateCoachSnapshot(
    coachUserId: string,
    input: ReportRangeInput | "weekly" | "monthly" = "weekly",
  ) {
    const rangeInput: ReportRangeInput = typeof input === "string" ? { period: input } : input;
    const { start, end, period } = resolveReportRange(rangeInput);
    const profile = await coachProfilesRepository.findByUserId(coachUserId);
    const meals = await mealsRepository.findAllMeals();
    const periodMeals = mealsInRange(meals, start, end);
    const reviews = await mealCoachReviewsRepository.findByMealIds(periodMeals.map((m) => m.id));

    const metrics = {
      period,
      coachActivity: {
        reviewsCompleted: reviews.filter((r) => r.action === "approve" || r.action === "reject")
          .length,
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

  async generateAllCoachSnapshots(input: ReportRangeInput | "weekly" | "monthly" = "weekly") {
    const coaches = await usersRepository.findByRole("coach");
    const results = [];
    for (const coach of coaches) {
      results.push(await this.generateCoachSnapshot(coach.id, input));
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
