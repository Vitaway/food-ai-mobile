import { AppDataSource } from "../config/database";
import { ConsumerDailyHealthScore } from "../modules/consumers/daily-health-score.entity";
import { mealsRepository } from "../modules/meals/meals.repository";
import { mealCoachReviewsRepository } from "../modules/meals/meal-coach-reviews.repository";
import { computeDashboard } from "../modules/consumers/dashboard.util";
import { reportsService } from "../modules/reports/reports.service";
import { logger } from "../config/logger";
import { ReportSnapshot } from "../modules/reports/report-snapshot.entity";

const healthScoreRepo = AppDataSource.getRepository(ConsumerDailyHealthScore);
const reportsRepo = AppDataSource.getRepository(ReportSnapshot);

let lastMonthlyRun = "";

async function shouldGenerateMonthly() {
  const key = new Date().toISOString().slice(0, 7);
  if (lastMonthlyRun === key) return false;
  const day = new Date().getDate();
  if (day !== 1 && day !== 15) return false;
  lastMonthlyRun = key;
  return true;
}

async function hasSnapshot(scopeType: "admin" | "consumer" | "coach", scopeId: string, period: "weekly" | "monthly") {
  const { start, end } = reportsService.periodRange(period);
  const existing = await reportsRepo.findOne({
    where: { scopeType, scopeId, period, periodStart: start, periodEnd: end },
  });
  return Boolean(existing);
}

export async function generateScheduledReports() {
  try {
    if (!(await hasSnapshot("admin", "platform", "weekly"))) {
      await reportsService.generatePlatformSnapshot("weekly");
    }
    await reportsService.generateAllConsumerSnapshots("weekly");
    await reportsService.generateAllCoachSnapshots("weekly");

    if (await shouldGenerateMonthly()) {
      await reportsService.generatePlatformSnapshot("monthly");
      await reportsService.generateAllConsumerSnapshots("monthly");
      await reportsService.generateAllCoachSnapshots("monthly");
      logger.info("Scheduled monthly reports generated");
    }

    logger.info("Scheduled weekly reports generated");
  } catch (err) {
    logger.error({ err }, "Failed to generate scheduled reports");
  }
}

export async function backfillConsumerHealthScores() {
  const consumers = await mealsRepository.findAllConsumers();
  for (const consumer of consumers) {
    const meals = await mealsRepository.findMealsByClientId(consumer.id);
    const reviews = await mealCoachReviewsRepository.findByMealIds(meals.map((m) => m.id));
    const byMealId = new Map(reviews.map((r) => [r.mealId, r]));

    const dates = new Set(meals.map((m) => m.submittedAt.toISOString().slice(0, 10)));
    for (const date of dates) {
      const dashboard = computeDashboard(consumer.profile, consumer.dashboard, meals, byMealId, date);
      await healthScoreRepo.upsert(
        {
          clientId: consumer.id,
          date,
          nutrientScore: String(dashboard.healthScoreBreakdown.nutrientScore),
          macroScore: String(dashboard.healthScoreBreakdown.macroScore),
          calorieScore: String(dashboard.healthScoreBreakdown.calorieScore),
          consistencyScore: String(dashboard.healthScoreBreakdown.consistencyScore),
          varietyScore: String(dashboard.healthScoreBreakdown.varietyScore),
          totalScore: String(dashboard.healthScore),
          context: {
            caloriesConsumed: dashboard.caloriesConsumed,
            calorieTarget: dashboard.calorieTarget,
          },
        },
        ["clientId", "date"],
      );
    }
  }
}

export function startReportScheduler() {
  const dayMs = 24 * 60 * 60 * 1000;
  void backfillConsumerHealthScores();
  void generateScheduledReports();
  setInterval(() => void generateScheduledReports(), dayMs);
}
