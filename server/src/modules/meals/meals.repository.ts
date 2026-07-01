import { AppDataSource } from "../../config/database";
import { ConsumerProfile } from "./consumer-profile.entity";
import { MealSubmission } from "./meal-submission.entity";

export class MealsRepository {
  private consumers = AppDataSource.getRepository(ConsumerProfile);
  private meals = AppDataSource.getRepository(MealSubmission);

  findAllConsumers() {
    return this.consumers.find({ order: { id: "ASC" } });
  }

  findConsumerById(id: string) {
    return this.consumers.findOne({ where: { id } });
  }

  findAllMeals() {
    return this.meals.find();
  }

  findMealById(id: string) {
    return this.meals.findOne({ where: { id } });
  }

  saveMeal(meal: MealSubmission) {
    return this.meals.save(meal);
  }

  async upsertConsumer(id: string, profile: Record<string, unknown>, dashboard: Record<string, unknown>) {
    const existing = await this.findConsumerById(id);
    if (existing) {
      existing.profile = profile;
      existing.dashboard = dashboard;
      await this.consumers.save(existing);
      return;
    }
    await this.consumers.save(this.consumers.create({ id, profile, dashboard }));
  }

  async upsertMeal(input: {
    id: string;
    clientId: string;
    status: string;
    mealType: string;
    submittedAt: Date;
    data: Record<string, unknown>;
  }) {
    const existing = await this.findMealById(input.id);
    if (existing) {
      existing.clientId = input.clientId;
      existing.status = input.status;
      existing.mealType = input.mealType;
      existing.submittedAt = input.submittedAt;
      existing.data = input.data;
      await this.meals.save(existing);
      return;
    }
    await this.meals.save(
      this.meals.create({
        id: input.id,
        clientId: input.clientId,
        status: input.status,
        mealType: input.mealType,
        submittedAt: input.submittedAt,
        data: input.data,
      }),
    );
  }
}

export const mealsRepository = new MealsRepository();
