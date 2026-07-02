import { AppDataSource } from "../../config/database";
import { UserPushToken } from "./user-push-token.entity";

export class PushTokensRepository {
  private repo = AppDataSource.getRepository(UserPushToken);

  findByUserId(userId: string) {
    return this.repo.find({ where: { userId } });
  }

  findByToken(token: string) {
    return this.repo.findOne({ where: { token } });
  }

  async upsert(userId: string, token: string, platform: string) {
    const existing = await this.findByToken(token);
    if (existing) {
      existing.userId = userId;
      existing.platform = platform;
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ userId, token, platform }));
  }

  async remove(userId: string, token: string) {
    await this.repo.delete({ userId, token });
  }

  async removeInvalidTokens(tokens: string[]) {
    if (!tokens.length) return;
    await this.repo
      .createQueryBuilder()
      .delete()
      .where("token IN (:...tokens)", { tokens })
      .execute();
  }
}

export const pushTokensRepository = new PushTokensRepository();
