import { AppDataSource } from "../../config/database";
import { Cohort, CohortMember } from "./cohort.entity";

export class CohortsRepository {
  private cohorts = AppDataSource.getRepository(Cohort);
  private members = AppDataSource.getRepository(CohortMember);

  findAll() {
    return this.cohorts.find({ order: { name: "ASC" } });
  }

  findById(id: string) {
    return this.cohorts.findOne({ where: { id } });
  }

  findMembersByCohortId(cohortId: string) {
    return this.members.find({ where: { cohortId } });
  }

  findCohortsForClient(clientId: string) {
    return this.members.find({ where: { clientId } });
  }

  async clientIdsInCohort(cohortId: string): Promise<string[]> {
    const rows = await this.findMembersByCohortId(cohortId);
    return rows.map((r) => r.clientId);
  }

  async memberCount(cohortId: string) {
    return this.members.count({ where: { cohortId } });
  }

  createCohort(input: { name: string; organization?: string; description?: string }) {
    return this.cohorts.save(this.cohorts.create(input));
  }

  addMember(cohortId: string, clientId: string) {
    return this.members.save(this.members.create({ cohortId, clientId }));
  }
}

export const cohortsRepository = new CohortsRepository();
