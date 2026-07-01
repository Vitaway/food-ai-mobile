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
}

export const authRepository = new AuthRepository();
