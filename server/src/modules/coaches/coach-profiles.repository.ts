import { AppDataSource } from "../../config/database";
import { CoachProfile } from "./coach-profile.entity";

export class CoachProfilesRepository {
  private repo = AppDataSource.getRepository(CoachProfile);

  findByUserId(userId: string) {
    return this.repo.findOne({ where: { userId } });
  }

  findByOrganization(organization: string) {
    return this.repo
      .createQueryBuilder("profile")
      .where("LOWER(profile.organization) = LOWER(:organization)", { organization: organization.trim() })
      .getMany();
  }

  create(data: Partial<CoachProfile>) {
    return this.repo.create(data);
  }

  save(profile: CoachProfile) {
    return this.repo.save(profile);
  }
}

export const coachProfilesRepository = new CoachProfilesRepository();
