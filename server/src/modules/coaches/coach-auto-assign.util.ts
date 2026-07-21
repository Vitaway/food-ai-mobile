import { AppDataSource } from "../../config/database";
import { Organization } from "../payments/organization.entity";
import { CoachProfile } from "./coach-profile.entity";
import { coachAssignmentsRepository } from "./coach-assignments.repository";
import { coachProfilesRepository } from "./coach-profiles.repository";
import { usersRepository } from "../users/users.repository";
import type { User } from "../users/user.entity";
import { logger } from "../../config/logger";

async function resolveOrganizationName(user: User): Promise<string | null> {
  if (!user.organizationId) return null;
  const org = await AppDataSource.getRepository(Organization).findOne({
    where: { id: user.organizationId },
  });
  return org?.name?.trim() ?? null;
}

async function activeCoachCandidates(organizationName: string | null): Promise<string[]> {
  const profiles = organizationName
    ? await coachProfilesRepository.findByOrganization(organizationName)
    : await AppDataSource.getRepository(CoachProfile).find();

  const ids: string[] = [];
  for (const profile of profiles) {
    const coach = await usersRepository.findById(profile.userId);
    if (!coach?.isActive) continue;
    if (coach.role !== "coach" && coach.role !== "nutrition_coach") continue;
    ids.push(coach.id);
  }
  return ids;
}

/** Assigns the lowest-caseload active coach when a patient has none yet. */
export async function autoAssignCoachForClient(
  clientId: string,
  user: User,
  assignedBy = "system",
): Promise<string | null> {
  const existing = await coachAssignmentsRepository.findByClientId(clientId);
  if (existing.length > 0) return existing[0]!.coachUserId;

  const orgName = await resolveOrganizationName(user);
  const candidates = await activeCoachCandidates(orgName);
  if (candidates.length === 0) {
    logger.debug({ clientId, orgName }, "No coaches available for auto-assignment");
    return null;
  }

  let chosen = candidates[0]!;
  let lowestCaseload = Number.POSITIVE_INFINITY;
  for (const coachUserId of candidates) {
    const caseload = await coachAssignmentsRepository.countByCoach(coachUserId);
    if (caseload < lowestCaseload) {
      lowestCaseload = caseload;
      chosen = coachUserId;
    }
  }

  await coachAssignmentsRepository.assign(chosen, clientId, assignedBy);
  logger.info({ clientId, coachUserId: chosen, orgName }, "Auto-assigned coach to new patient");
  return chosen;
}
