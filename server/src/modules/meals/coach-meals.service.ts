import { NotFoundError } from "routing-controllers";
import { mealsRepository } from "./meals.repository";
import { consumerProfilesRepository } from "../consumers/consumer-profiles.repository";
import { notificationsService } from "../notifications/notifications.service";
import { usersRepository } from "../users/users.repository";
import { emailService } from "../../services/email.service";
import { logger } from "../../config/logger";
import { computeDashboard } from "../consumers/dashboard.util";
import type { MealSubmission } from "./meal-submission.entity";
import type { ReviewMealDto } from "./meals.dto";

function toMealDto(row: MealSubmission) {
  return {
    id: row.id,
    clientId: row.clientId,
    mealType: row.mealType,
    status: row.status,
    submittedAt: row.submittedAt.toISOString(),
    ...row.data,
  };
}

function coachSafeFirstName(displayName: unknown): string {
  if (typeof displayName !== "string" || !displayName.trim()) return "Patient";
  return displayName.trim().split(/\s+/)[0];
}

function toClientDto(
  consumer: { id: string; profile: Record<string, unknown>; dashboard: Record<string, unknown> },
  meals: MealSubmission[] = [],
) {
  return {
    patientId: consumer.id,
    profile: {
      ...consumer.profile,
      displayName: coachSafeFirstName(consumer.profile.displayName),
    },
    dashboard: computeDashboard(consumer.profile, consumer.dashboard, meals),
  };
}

function groupMealsByClient(meals: MealSubmission[]) {
  const map = new Map<string, MealSubmission[]>();
  for (const meal of meals) {
    const list = map.get(meal.clientId) ?? [];
    list.push(meal);
    map.set(meal.clientId, list);
  }
  return map;
}

export const coachMealsService = {
  async getStats() {
    const meals = await mealsRepository.findAllMeals();
    const today = new Date().toISOString().slice(0, 10);
    const inReview = meals.filter((m) => m.status === "in_review").length;
    const analyzing = meals.filter((m) => m.status === "analyzing").length;
    const flagged = meals.filter(
      (m) => m.status === "in_review" && m.data.fraudCheckResult === "flag",
    ).length;
    const approvedToday = meals.filter(
      (m) =>
        m.status === "approved" &&
        m.submittedAt.toISOString().slice(0, 10) === today,
    ).length;

    return {
      inReview,
      analyzing,
      approvedToday,
      flagged,
      avgReviewMinutes: 0,
    };
  },

  async getQueue() {
    const meals = await mealsRepository.findAllMeals();
    const queue = meals
      .filter((m) => m.status === "in_review")
      .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());

    const mealsByClient = groupMealsByClient(meals);
    const items = [];
    for (const meal of queue) {
      const consumer = await mealsRepository.findConsumerById(meal.clientId);
      if (!consumer) continue;
      items.push({
        meal: toMealDto(meal),
        client: toClientDto(consumer, mealsByClient.get(consumer.id) ?? []),
      });
    }
    return items;
  },

  async getMealById(id: string) {
    const meal = await mealsRepository.findMealById(id);
    if (!meal) return null;
    const consumer = await mealsRepository.findConsumerById(meal.clientId);
    if (!consumer) return null;
    const clientMeals = await mealsRepository.findMealsByClientId(meal.clientId);
    return {
      meal: toMealDto(meal),
      client: toClientDto(consumer, clientMeals),
    };
  },

  async getClients() {
    const [consumers, meals] = await Promise.all([
      mealsRepository.findAllConsumers(),
      mealsRepository.findAllMeals(),
    ]);
    const mealsByClient = groupMealsByClient(meals);
    return consumers.map((consumer) =>
      toClientDto(consumer, mealsByClient.get(consumer.id) ?? []),
    );
  },

  async reviewMeal(mealId: string, coachId: string, dto: ReviewMealDto) {
    const meal = await mealsRepository.findMealById(mealId);
    if (!meal) throw new NotFoundError("Meal not found");

    meal.status = dto.action === "approve" ? "approved" : "rejected";
    if (dto.mealName) meal.data.mealName = dto.mealName;
    if (dto.items) meal.data.items = dto.items;
    meal.data.coachReview = {
      coachId,
      note: dto.note,
      reviewedAt: new Date().toISOString(),
    };

    await mealsRepository.saveMeal(meal);

    const consumer = await consumerProfilesRepository.findById(meal.clientId);
    if (consumer?.userId) {
      const mealName = (meal.data.mealName as string | undefined) ?? undefined;
      void notificationsService.notifyMealStatus(consumer.userId, {
        id: meal.id,
        mealName,
        status: meal.status,
      });

      if (meal.status === "approved" || meal.status === "rejected") {
        const user = await usersRepository.findById(consumer.userId);
        if (user?.email) {
          const profile = consumer.profile as Record<string, unknown>;
          void emailService
            .sendMealStatusEmail(user.email, {
              displayName: typeof profile.displayName === "string" ? profile.displayName : user.displayName,
              mealName: mealName ?? "Your meal",
              status: meal.status,
              coachNote: dto.note ?? null,
            })
            .catch((err) => logger.error({ err, userId: user.id }, "Failed to send meal status email"));
        }
      }
    }

    return toMealDto(meal);
  },
};
