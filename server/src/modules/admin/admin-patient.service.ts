import { NotFoundError, ForbiddenError } from "routing-controllers";
import { coachMealsService } from "../meals/coach-meals.service";
import { coachAssignmentsRepository } from "../coaches/coach-assignments.repository";
import { consumerProfilesRepository } from "../consumers/consumer-profiles.repository";
import { usersRepository } from "../users/users.repository";
import { clinicalAssessmentService } from "../consumers/clinical-assessment.service";
import { coachingFeedService } from "../consumers/coaching-feed.service";
import type { User } from "../users/user.entity";
import type {
  ConfirmClinicalAssessmentDto,
  SaveClinicalAssessmentDto,
} from "../coaches/coach.dto";
import { isPlatformAdmin } from "./organizations.service";

function assertCanManagePatient(actor: User, target: User) {
  if (isPlatformAdmin(actor.role)) return;
  if (actor.role === "organization_admin") {
    if (!actor.organizationId) {
      throw new ForbiddenError("Your account has no organization assigned");
    }
    if (target.id !== actor.id && target.organizationId !== actor.organizationId) {
      throw new ForbiddenError("Cannot manage users outside your organization");
    }
    return;
  }
  throw new ForbiddenError("Insufficient permissions");
}

async function resolvePatient(actor: User, userId: string) {
  const user = await usersRepository.findById(userId);
  if (!user) throw new NotFoundError("User not found");
  assertCanManagePatient(actor, user);
  const consumer = await consumerProfilesRepository.findByUserId(userId);
  if (!consumer) throw new NotFoundError("Patient profile not found");
  return { user, consumer, clientId: consumer.id };
}

export const adminPatientService = {
  resolvePatient,

  async getPatientView(actor: User, userId: string) {
    const { clientId } = await resolvePatient(actor, userId);
    return coachMealsService.getClientByIdUnchecked(clientId);
  },

  async setClientCoaches(actor: User, userId: string, coachUserIds: string[]) {
    const { clientId } = await resolvePatient(actor, userId);
    const uniqueIds = [...new Set(coachUserIds.map((id) => id.trim()).filter(Boolean))];

    for (const coachUserId of uniqueIds) {
      const coach = await usersRepository.findById(coachUserId);
      if (!coach?.isActive) throw new NotFoundError(`Coach not found: ${coachUserId}`);
      if (coach.role !== "coach" && coach.role !== "nutrition_coach" && coach.role !== "admin") {
        throw new ForbiddenError("Assignee must be a coach");
      }
    }

    const existing = await coachAssignmentsRepository.findByClientId(clientId);
    const existingIds = new Set(existing.map((a) => a.coachUserId));
    const targetIds = new Set(uniqueIds);

    for (const coachUserId of uniqueIds) {
      if (!existingIds.has(coachUserId)) {
        await coachAssignmentsRepository.assign(coachUserId, clientId, actor.id);
      }
    }
    for (const row of existing) {
      if (!targetIds.has(row.coachUserId)) {
        await coachAssignmentsRepository.unassign(row.coachUserId, clientId);
      }
    }

    return {
      clientId,
      assignedCoachIds: uniqueIds,
    };
  },

  async getWeeklySummary(actor: User, userId: string) {
    const { clientId } = await resolvePatient(actor, userId);
    return coachMealsService.getClientWeeklySummaryUnchecked(clientId);
  },

  async getCoachingInsights(actor: User, userId: string) {
    const { clientId } = await resolvePatient(actor, userId);
    return coachingFeedService.listForCoachClient(clientId);
  },

  async getClinicalAssessment(actor: User, userId: string) {
    const { clientId } = await resolvePatient(actor, userId);
    return clinicalAssessmentService.getByClientId(clientId);
  },

  async saveClinicalAssessment(
    actor: User,
    userId: string,
    adminUserId: string,
    dto: SaveClinicalAssessmentDto,
  ) {
    const { clientId } = await resolvePatient(actor, userId);
    return clinicalAssessmentService.saveDraftByClientId(clientId, adminUserId, dto);
  },

  async confirmClinicalAssessment(
    actor: User,
    userId: string,
    adminUserId: string,
    dto: ConfirmClinicalAssessmentDto,
  ) {
    const { clientId } = await resolvePatient(actor, userId);
    return clinicalAssessmentService.confirmByClientId(clientId, adminUserId, dto);
  },
};
