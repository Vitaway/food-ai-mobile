import { AppDataSource } from "../../config/database";
import { Organization } from "../payments/organization.entity";
import { coachAssignmentsRepository } from "./coach-assignments.repository";
import { coachProfilesRepository } from "./coach-profiles.repository";
import { consumerProfilesRepository } from "../consumers/consumer-profiles.repository";
import { usersRepository } from "../users/users.repository";
import { isCoachLikeRole } from "../../middlewares/auth.middleware";

export async function resolveCoachUserIdsForClient(clientId: string): Promise<string[]> {
  const assigned = await coachAssignmentsRepository.findCoachIdsForClient(clientId);
  const ids = new Set(assigned.map((row) => row.coachUserId));

  if (ids.size === 0) {
    const consumer = await consumerProfilesRepository.findById(clientId);
    if (consumer?.userId) {
      const user = await usersRepository.findById(consumer.userId);
      if (user?.organizationId) {
        const org = await AppDataSource.getRepository(Organization).findOne({
          where: { id: user.organizationId },
        });
        if (org?.name?.trim()) {
          const profiles = await coachProfilesRepository.findByOrganization(org.name);
          for (const profile of profiles) ids.add(profile.userId);
        }
      }
    }
  }

  const coaches: string[] = [];
  for (const id of ids) {
    const user = await usersRepository.findById(id);
    if (user?.isActive && isCoachLikeRole(user.role)) {
      coaches.push(id);
    }
  }
  return coaches;
}
