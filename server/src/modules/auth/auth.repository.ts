import { AppDataSource } from "../../config/database";
import { UserSession } from "./user-session.entity";

export class AuthRepository {
  private repo = AppDataSource.getRepository(UserSession);

  create(data: Partial<UserSession>) {
    return this.repo.create(data);
  }

  save(session: UserSession) {
    return this.repo.save(session);
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(UserSession)
      .set({ revokedAt: new Date() })
      .where("user_id = :userId", { userId })
      .andWhere("revoked_at IS NULL")
      .execute();
    return result.affected ?? 0;
  }
}

export const authRepository = new AuthRepository();
