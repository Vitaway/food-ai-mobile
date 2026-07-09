import { AppDataSource } from "../../config/database";
import { MealCoachReview } from "./meal-coach-review.entity";

export class MealCoachReviewsRepository {
  private repo = AppDataSource.getRepository(MealCoachReview);

  findByMealId(mealId: string) {
    return this.repo.findOne({ where: { mealId } });
  }

  findByMealIds(mealIds: string[]) {
    if (!mealIds.length) return Promise.resolve([]);
    return this.repo
      .createQueryBuilder("r")
      .where("r.meal_id IN (:...mealIds)", { mealIds })
      .getMany();
  }

  findByCoachId(coachId: string) {
    return this.repo.find({ where: { coachId }, order: { reviewedAt: "DESC" } });
  }

  findAll() {
    return this.repo.find({ order: { reviewedAt: "DESC" } });
  }

  findRecent(limit = 100, offset = 0) {
    return this.repo.find({
      order: { reviewedAt: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  countAll() {
    return this.repo.count();
  }

  save(review: Partial<MealCoachReview> & { mealId: string; coachId: string; action: "approve" | "reject" }) {
    return this.repo.save(this.repo.create(review));
  }
}

export const mealCoachReviewsRepository = new MealCoachReviewsRepository();
