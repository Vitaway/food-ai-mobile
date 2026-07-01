import { AppDataSource } from "../../config/database";
import { CoachProfile } from "./coach-profile.entity";

export class CoachProfilesRepository {
  private repo = AppDataSource.getRepository(CoachProfile);

  findByUserId(userId: string) {
    return this.repo.findOne({ where: { userId } });
  }

  create(data: Partial<CoachProfile>) {
    return this.repo.create(data);
  }

  save(profile: CoachProfile) {
    return this.repo.save(profile);
  }
}

export const coachProfilesRepository = new CoachProfilesRepository();
