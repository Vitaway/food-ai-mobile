import { IsNull } from "typeorm";
import { AppDataSource } from "../../config/database";
import { UserNotification } from "./notification.entity";

export class NotificationsRepository {
  private repo = AppDataSource.getRepository(UserNotification);

  findByUserId(userId: string, limit = 50) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  countUnread(userId: string) {
    return this.repo.count({ where: { userId, readAt: IsNull() } });
  }

  findByIdForUser(id: string, userId: string) {
    return this.repo.findOne({ where: { id, userId } });
  }

  save(notification: UserNotification) {
    return this.repo.save(notification);
  }

  create(data: Partial<UserNotification>) {
    return this.repo.create(data);
  }

  async markAllRead(userId: string) {
    await this.repo
      .createQueryBuilder()
      .update(UserNotification)
      .set({ readAt: new Date() })
      .where("user_id = :userId", { userId })
      .andWhere("read_at IS NULL")
      .execute();
  }
}

export const notificationsRepository = new NotificationsRepository();
