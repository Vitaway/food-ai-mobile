import { AppDataSource } from "../../config/database";
import { CoachClientAssignment } from "./coach-client-assignment.entity";

export class CoachAssignmentsRepository {
  private repo = AppDataSource.getRepository(CoachClientAssignment);

  findByCoachUserId(coachUserId: string) {
    return this.repo.find({ where: { coachUserId }, order: { assignedAt: "DESC" } });
  }

  findAll() {
    return this.repo.find({ order: { assignedAt: "DESC" } });
  }

  findByClientId(clientId: string) {
    return this.repo.find({ where: { clientId } });
  }

  findCoachIdsForClient(clientId: string) {
    return this.repo.find({ where: { clientId }, select: ["coachUserId"] });
  }

  async assign(coachUserId: string, clientId: string, assignedBy?: string) {
    const existing = await this.repo.findOne({ where: { coachUserId, clientId } });
    if (existing) return existing;
    return this.repo.save(
      this.repo.create({ coachUserId, clientId, assignedBy: assignedBy ?? null }),
    );
  }

  async unassign(coachUserId: string, clientId: string) {
    const result = await this.repo.delete({ coachUserId, clientId });
    return (result.affected ?? 0) > 0;
  }

  countByCoach(coachUserId: string) {
    return this.repo.count({ where: { coachUserId } });
  }
}

export const coachAssignmentsRepository = new CoachAssignmentsRepository();
