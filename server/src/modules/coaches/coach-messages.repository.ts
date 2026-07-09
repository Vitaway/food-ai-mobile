import { AppDataSource } from "../../config/database";
import { CoachMessage } from "./coach-message.entity";

export class CoachMessagesRepository {
  private repo = AppDataSource.getRepository(CoachMessage);

  findThread(coachUserId: string, clientId: string, limit = 100) {
    return this.repo.find({
      where: { coachUserId, clientId },
      order: { createdAt: "ASC" },
      take: limit,
    });
  }

  save(message: {
    coachUserId: string;
    clientId: string;
    senderRole: "coach" | "consumer";
    body: string;
    mealId?: string;
  }) {
    return this.repo.save(this.repo.create(message));
  }

  async markReadForCoach(coachUserId: string, clientId: string) {
    await this.repo
      .createQueryBuilder()
      .update(CoachMessage)
      .set({ readAt: new Date() })
      .where("coach_user_id = :coachUserId", { coachUserId })
      .andWhere("client_id = :clientId", { clientId })
      .andWhere("sender_role = 'consumer'")
      .andWhere("read_at IS NULL")
      .execute();
  }

  countUnreadForCoach(coachUserId: string) {
    return this.repo.count({
      where: { coachUserId, senderRole: "consumer", readAt: null as unknown as undefined },
    });
  }

  unreadByClient(coachUserId: string) {
    return this.repo
      .createQueryBuilder("m")
      .select("m.client_id", "clientId")
      .addSelect("COUNT(*)::int", "count")
      .where("m.coach_user_id = :coachUserId", { coachUserId })
      .andWhere("m.sender_role = 'consumer'")
      .andWhere("m.read_at IS NULL")
      .groupBy("m.client_id")
      .getRawMany<{ clientId: string; count: number }>();
  }
}

export const coachMessagesRepository = new CoachMessagesRepository();
