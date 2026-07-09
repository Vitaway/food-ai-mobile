import { AppDataSource } from "../../config/database";
import { MealReviewTask } from "./meal-review-task.entity";

export class MealReviewTasksRepository {
  private repo = AppDataSource.getRepository(MealReviewTask);

  findByMealId(mealId: string) {
    return this.repo.find({ where: { mealId }, order: { createdAt: "DESC" } });
  }

  findOpenByMealId(mealId: string) {
    return this.repo.find({ where: { mealId, status: "open" }, order: { createdAt: "DESC" } });
  }

  create(data: Partial<MealReviewTask>) {
    return this.repo.save(this.repo.create(data));
  }

  async resolve(id: string) {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return null;
    row.status = "resolved";
    return this.repo.save(row);
  }
}

export const mealReviewTasksRepository = new MealReviewTasksRepository();
