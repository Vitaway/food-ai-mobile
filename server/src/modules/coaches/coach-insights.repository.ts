import { AppDataSource } from "../../config/database";
import { CoachInsight } from "./coach-insight.entity";

export class CoachInsightsRepository {
  private repo = AppDataSource.getRepository(CoachInsight);

  create(input: {
    coachUserId: string;
    clientId: string;
    type: CoachInsight["type"];
    title: string;
    body: string;
  }) {
    return this.repo.save(this.repo.create(input));
  }

  findByClientId(clientId: string, limit = 20) {
    return this.repo.find({
      where: { clientId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  findByCoachUserId(coachUserId: string, limit = 50) {
    return this.repo.find({
      where: { coachUserId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}

export const coachInsightsRepository = new CoachInsightsRepository();
