import { AppDataSource } from "../../config/database";
import { User } from "./user.entity";
import type { UserRole } from "../../middlewares/auth.middleware";

export class UsersRepository {
  private repo = AppDataSource.getRepository(User);

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email: email.toLowerCase().trim() } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByReferralCode(code: string) {
    return this.repo.findOne({ where: { referralCode: code.toUpperCase().trim() } });
  }

  countReferrals(userId: string) {
    return this.repo.count({ where: { referredByUserId: userId } });
  }

  findByRole(role: UserRole) {
    return this.repo.find({ where: { role }, order: { createdAt: "DESC" } });
  }

  findAllActive() {
    return this.repo.find({
      where: { isActive: true },
      order: { displayName: "ASC" },
    });
  }

  countByRole(role: UserRole) {
    return this.repo.count({ where: { role } });
  }

  save(user: User) {
    return this.repo.save(user);
  }

  create(data: Partial<User>) {
    return this.repo.create(data);
  }
}

export const usersRepository = new UsersRepository();
