import { AppDataSource } from "../../config/database";
import { CoachReviewDraft } from "./coach-review-draft.entity";

export class CoachReviewDraftsRepository {
  private repo = AppDataSource.getRepository(CoachReviewDraft);

  findByMealAndCoach(mealId: string, coachId: string) {
    return this.repo.findOne({ where: { mealId, coachId } });
  }

  async upsert(data: Partial<CoachReviewDraft> & { mealId: string; coachId: string }) {
    const existing = await this.findByMealAndCoach(data.mealId, data.coachId);
    if (existing) {
      Object.assign(existing, data);
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create(data));
  }

  async delete(mealId: string, coachId: string) {
    await this.repo.delete({ mealId, coachId });
  }
}

export const coachReviewDraftsRepository = new CoachReviewDraftsRepository();
