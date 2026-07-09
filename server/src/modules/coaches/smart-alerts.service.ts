import { mealsRepository } from "../meals/meals.repository";
import { mealCoachReviewsRepository } from "../meals/meal-coach-reviews.repository";
import { computeDashboard } from "../consumers/dashboard.util";
import { AppDataSource } from "../../config/database";
import { ConsumerDailyHealthScore } from "../consumers/daily-health-score.entity";
import {
  filterConsumersForCoach,
  resolveCoachCaseloadIds,
} from "../meals/coach-scope.util";

export type SmartCoachAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  clientId: string;
  clientName: string;
  message: string;
  category: "adherence" | "nutrition" | "hydration" | "health_score";
};

function daysAgoKey(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const smartAlertsService = {
  async listForCoach(coachId: string): Promise<SmartCoachAlert[]> {
    const clientIds = await resolveCoachCaseloadIds(coachId);
    const consumers = filterConsumersForCoach(await mealsRepository.findAllConsumers(), clientIds);
    const alerts: SmartCoachAlert[] = [];

    for (const client of consumers) {
      const meals = await mealsRepository.findMealsByClientId(client.id);
      const reviews = await mealCoachReviewsRepository.findByMealIds(meals.map((m) => m.id));
      const byMealId = new Map(reviews.map((r) => [r.mealId, r]));
      const displayName = String(client.profile.displayName ?? client.id);

      const last3Days = [0, 1, 2].map(daysAgoKey);
      const loggedDays = last3Days.filter((day) =>
        meals.some((m) => m.submittedAt.toISOString().slice(0, 10) === day),
      );
      if (loggedDays.length === 0) {
        alerts.push({
          id: `inactive-${client.id}`,
          severity: "critical",
          clientId: client.id,
          clientName: displayName,
          message: "Has not logged meals in the past 3 days",
          category: "adherence",
        });
      }

      const breakfastSkipped = [0, 1, 2, 3].filter((offset) => {
        const day = daysAgoKey(offset);
        const dayMeals = meals.filter((m) => m.submittedAt.toISOString().slice(0, 10) === day);
        return dayMeals.length > 0 && !dayMeals.some((m) => m.mealType === "breakfast");
      });
      if (breakfastSkipped.length >= 4) {
        alerts.push({
          id: `breakfast-${client.id}`,
          severity: "warning",
          clientId: client.id,
          clientName: displayName,
          message: "Skipped breakfast 4 days this week",
          category: "adherence",
        });
      }

      let lowProteinStreak = 0;
      for (let i = 0; i < 5; i++) {
        const day = daysAgoKey(i);
        const dashboard = computeDashboard(client.profile, client.dashboard, meals, byMealId, day);
        const target = Number((client.profile.macroTargets as Record<string, number> | undefined)?.proteinG ?? 120);
        if (dashboard.macrosConsumed.proteinG < target * 0.7) lowProteinStreak += 1;
        else break;
      }
      if (lowProteinStreak >= 5) {
        alerts.push({
          id: `protein-${client.id}`,
          severity: "warning",
          clientId: client.id,
          clientName: displayName,
          message: "Protein intake below target for 5 consecutive days",
          category: "nutrition",
        });
      }

      const healthRepo = AppDataSource.getRepository(ConsumerDailyHealthScore);
      const scores = await healthRepo.find({
        where: { clientId: client.id },
        order: { date: "DESC" },
        take: 14,
      });
      if (scores.length >= 2) {
        const recent = scores.slice(0, 7);
        const prior = scores.slice(7, 14);
        const recentAvg =
          recent.reduce((sum, row) => sum + Number(row.totalScore), 0) / Math.max(recent.length, 1);
        const priorAvg =
          prior.reduce((sum, row) => sum + Number(row.totalScore), 0) / Math.max(prior.length, 1);
        if (prior.length >= 3 && recentAvg < priorAvg - 8) {
          alerts.push({
            id: `score-${client.id}`,
            severity: "warning",
            clientId: client.id,
            clientName: displayName,
            message: "Health score declined for two consecutive weeks",
            category: "health_score",
          });
        }
      }

      const waterToday = Number(client.dashboard.waterMl ?? 0);
      const waterTarget = Number(client.profile.waterTargetMl ?? 2000);
      if (waterToday > 0 && waterToday < waterTarget * 0.4) {
        alerts.push({
          id: `water-${client.id}`,
          severity: "info",
          clientId: client.id,
          clientName: displayName,
          message: "Water intake is well below target today",
          category: "hydration",
        });
      }
    }

    return alerts.slice(0, 50);
  },
};
