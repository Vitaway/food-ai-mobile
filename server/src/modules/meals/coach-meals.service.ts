import { NotFoundError } from "routing-controllers";
import { mealsRepository } from "./meals.repository";
import { consumerProfilesRepository } from "../consumers/consumer-profiles.repository";
import { notificationsService } from "../notifications/notifications.service";
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

function toClientDto(consumer: { id: string; profile: Record<string, unknown>; dashboard: Record<string, unknown> }) {
  return {
    patientId: consumer.id,
    profile: {
      ...consumer.profile,
      displayName: coachSafeFirstName(consumer.profile.displayName),
    },
    dashboard: consumer.dashboard,
  };
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

    const items = [];
    for (const meal of queue) {
      const consumer = await mealsRepository.findConsumerById(meal.clientId);
      if (!consumer) continue;
      items.push({
        meal: toMealDto(meal),
        client: toClientDto(consumer),
      });
    }
    return items;
  },

  async getMealById(id: string) {
    const meal = await mealsRepository.findMealById(id);
    if (!meal) return null;
    const consumer = await mealsRepository.findConsumerById(meal.clientId);
    if (!consumer) return null;
    return {
      meal: toMealDto(meal),
      client: toClientDto(consumer),
    };
  },

  async getClients() {
    const consumers = await mealsRepository.findAllConsumers();
    return consumers.map(toClientDto);
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
    }

    return toMealDto(meal);
  },
};
