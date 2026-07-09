import { AppDataSource } from "../../config/database";
import { mealsRepository } from "../meals/meals.repository";
import { mealCoachReviewsRepository } from "../meals/meal-coach-reviews.repository";
import { consumerProfilesRepository } from "./consumer-profiles.repository";
import { computeDashboard, todayKey } from "./dashboard.util";
import { ConsumerDailyHealthScore } from "./daily-health-score.entity";

export type CoachingFeedItem = {
  id: string;
  type: "tip" | "celebration" | "reminder" | "coach_note" | "trend";
  title: string;
  body: string;
  priority: number;
  actionLabel?: string;
  actionRoute?: string;
};

function daysAgoKey(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function uniqueFoodLabels(meals: Awaited<ReturnType<typeof mealsRepository.findMealsByClientId>>) {
  const labels = new Set<string>();
  for (const meal of meals) {
    const items = (meal.data.items as Array<{ label?: string }> | undefined) ?? [];
    for (const item of items) {
      const label = item.label?.trim().toLowerCase();
      if (label) labels.add(label);
    }
  }
  return labels;
}

export const coachingFeedService = {
  async listForConsumerUser(userId: string): Promise<CoachingFeedItem[]> {
    const profileRow = await consumerProfilesRepository.findByUserId(userId);
    if (!profileRow) return [];

    const clientId = profileRow.id;
    const meals = await mealsRepository.findMealsByClientId(clientId);
    const reviews = await mealCoachReviewsRepository.findByMealIds(meals.map((m) => m.id));
    const byMealId = new Map(reviews.map((r) => [r.mealId, r]));
    const dashboard = computeDashboard(profileRow.profile, profileRow.dashboard, meals, byMealId, todayKey());
    const items: CoachingFeedItem[] = [];

    const proteinTarget = Number(
      (profileRow.profile.macroTargets as { proteinG?: number } | undefined)?.proteinG ?? 120,
    );
    const fiberTarget = Number(
      (profileRow.profile.macroTargets as { fiberG?: number } | undefined)?.fiberG ?? 25,
    );
    const waterTarget = Number(profileRow.profile.waterTargetMl ?? 2000);

    if (dashboard.streakDays >= 3) {
      items.push({
        id: "streak",
        type: "celebration",
        title: `${dashboard.streakDays}-day logging streak`,
        body: "Consistent logging helps your coach spot patterns and give better guidance.",
        priority: 20,
        actionLabel: "Log today's meals",
        actionRoute: "/(tabs)/log",
      });
    }

    if (dashboard.macrosConsumed.proteinG < proteinTarget * 0.7) {
      items.push({
        id: "protein-low",
        type: "tip",
        title: "Boost protein today",
        body: `You're at ${Math.round(dashboard.macrosConsumed.proteinG)}g of your ${proteinTarget}g protein target. Try eggs, beans, or brochette.`,
        priority: 80,
        actionLabel: "Log a meal",
        actionRoute: "/(tabs)/log",
      });
    }

    if (dashboard.macrosConsumed.fiberG < fiberTarget * 0.6) {
      items.push({
        id: "fiber-low",
        type: "tip",
        title: "Add more fiber",
        body: "Leafy greens, beans, and whole grains improve nutrient adequacy and digestion.",
        priority: 70,
        actionLabel: "View health score",
        actionRoute: "/profile/health",
      });
    }

    if (dashboard.waterMl < waterTarget * 0.45) {
      items.push({
        id: "hydration",
        type: "reminder",
        title: "Stay hydrated",
        body: `You've logged ${dashboard.waterMl} ml of your ${waterTarget} ml water goal today.`,
        priority: 75,
        actionLabel: "Log water",
        actionRoute: "/(tabs)",
      });
    }

    const weekMeals = meals.filter((m) => m.submittedAt >= new Date(daysAgoKey(7)));
    if (weekMeals.length >= 3 && uniqueFoodLabels(weekMeals).size < 5) {
      items.push({
        id: "variety",
        type: "tip",
        title: "Mix up your meals",
        body: "Eating a wider variety of foods this week can improve your variety score.",
        priority: 55,
      });
    }

    const pendingReview = meals.find((m) => m.status === "in_review");
    if (pendingReview) {
      items.push({
        id: "coach-review",
        type: "reminder",
        title: "Coach review in progress",
        body: "A recent meal is being reviewed. You'll get a notification when it's done.",
        priority: 60,
        actionLabel: "View meal",
        actionRoute: `/meal/${pendingReview.id}`,
      });
    }

    const recentReview = reviews
      .filter((r) => r.note?.trim())
      .sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime())[0];
    if (recentReview?.note?.trim()) {
      items.push({
        id: `coach-note-${recentReview.id}`,
        type: "coach_note",
        title: "Note from your coach",
        body: recentReview.note.trim(),
        priority: 90,
        actionLabel: "Open chat",
        actionRoute: "/(tabs)/chat",
      });
    }

    const healthRepo = AppDataSource.getRepository(ConsumerDailyHealthScore);
    const scores = await healthRepo.find({
      where: { clientId },
      order: { date: "DESC" },
      take: 14,
    });
    if (scores.length >= 7) {
      const recent = scores.slice(0, 7);
      const prior = scores.slice(7, 14);
      const recentAvg =
        recent.reduce((sum, row) => sum + Number(row.totalScore), 0) / Math.max(recent.length, 1);
      const priorAvg =
        prior.reduce((sum, row) => sum + Number(row.totalScore), 0) / Math.max(prior.length, 1);
      if (prior.length >= 3 && recentAvg >= priorAvg + 5) {
        items.push({
          id: "score-up",
          type: "trend",
          title: "Health score trending up",
          body: `Your average score rose to ${Math.round(recentAvg)} this week. Keep it up!`,
          priority: 65,
          actionLabel: "See breakdown",
          actionRoute: "/profile/health",
        });
      } else if (prior.length >= 3 && recentAvg < priorAvg - 5) {
        items.push({
          id: "score-down",
          type: "trend",
          title: "Health score dipped",
          body: `Your weekly average fell to ${Math.round(recentAvg)}. Check macros and logging consistency.`,
          priority: 85,
          actionLabel: "See breakdown",
          actionRoute: "/profile/health",
        });
      }
    }

    if (dashboard.healthScoreBreakdown?.nutrientScore != null && dashboard.healthScoreBreakdown.nutrientScore < 60) {
      items.push({
        id: "nutrients",
        type: "tip",
        title: "Micronutrient boost",
        body: "Your nutrient adequacy score is low. Colorful vegetables and fortified staples can help.",
        priority: 72,
        actionLabel: "Health insights",
        actionRoute: "/profile/health",
      });
    }

    return items.sort((a, b) => b.priority - a.priority).slice(0, 8);
  },

  async listForCoachClient(clientId: string): Promise<CoachingFeedItem[]> {
    const consumers = await mealsRepository.findAllConsumers();
    const consumer = consumers.find((c) => c.id === clientId);
    if (!consumer?.profile) return [];

    const meals = await mealsRepository.findMealsByClientId(clientId);
    const reviews = await mealCoachReviewsRepository.findByMealIds(meals.map((m) => m.id));
    const byMealId = new Map(reviews.map((r) => [r.mealId, r]));
    const dashboard = computeDashboard(consumer.profile, consumer.dashboard, meals, byMealId, todayKey());
    const name = String(consumer.profile.displayName ?? "Client");
    const items: CoachingFeedItem[] = [];

    const last3 = [0, 1, 2].map(daysAgoKey);
    const loggedDays = last3.filter((day) =>
      meals.some((m) => m.submittedAt.toISOString().slice(0, 10) === day),
    );
    if (loggedDays.length === 0) {
      items.push({
        id: "inactive",
        type: "reminder",
        title: "No recent logs",
        body: `${name} has not logged meals in the past 3 days.`,
        priority: 95,
      });
    }

    const proteinTarget = Number(
      (consumer.profile.macroTargets as { proteinG?: number } | undefined)?.proteinG ?? 120,
    );
    if (dashboard.macrosConsumed.proteinG < proteinTarget * 0.7) {
      items.push({
        id: "protein",
        type: "tip",
        title: "Low protein today",
        body: `${name} is at ${Math.round(dashboard.macrosConsumed.proteinG)}g vs ${proteinTarget}g protein target.`,
        priority: 80,
      });
    }

    if (dashboard.healthScore < 55) {
      items.push({
        id: "low-score",
        type: "trend",
        title: "Low health score",
        body: `${name}'s health score is ${dashboard.healthScore}. Review recent meals and macros.`,
        priority: 88,
      });
    }

    const queueCount = meals.filter((m) => m.status === "in_review").length;
    if (queueCount > 0) {
      items.push({
        id: "queue",
        type: "reminder",
        title: "Meals awaiting review",
        body: `${queueCount} meal${queueCount === 1 ? "" : "s"} in the review queue.`,
        priority: 92,
      });
    }

    return items.sort((a, b) => b.priority - a.priority).slice(0, 6);
  },
};
