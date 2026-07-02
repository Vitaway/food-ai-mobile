import { AppDataSource } from "../../config/database";
import { ConsumerProfile } from "../meals/consumer-profile.entity";

export class ConsumerProfilesRepository {
  private repo = AppDataSource.getRepository(ConsumerProfile);

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByUserId(userId: string) {
    return this.repo.findOne({ where: { userId } });
  }

  findAll() {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  save(profile: ConsumerProfile) {
    return this.repo.save(profile);
  }

  create(data: Partial<ConsumerProfile>) {
    return this.repo.create(data);
  }
}

export const consumerProfilesRepository = new ConsumerProfilesRepository();
