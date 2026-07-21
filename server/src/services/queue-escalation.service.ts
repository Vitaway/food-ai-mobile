import { AppDataSource } from "../config/database";
import { Organization } from "../modules/payments/organization.entity";
import { coachAssignmentsRepository } from "../modules/coaches/coach-assignments.repository";
import { coachProfilesRepository } from "../modules/coaches/coach-profiles.repository";
import { chatService } from "../modules/chat/chat.service";
import { consumerProfilesRepository } from "../modules/consumers/consumer-profiles.repository";
import { waitingMinutes } from "../modules/meals/meal-effective.util";
import { mealsRepository } from "../modules/meals/meals.repository";
import {
  needsQueueEscalation,
  readQueuePick,
  writeQueuePick,
} from "../modules/meals/queue-pick.util";
import { usersRepository } from "../modules/users/users.repository";
import {
  QUEUE_ESCALATION_INTERVAL_MS,
  QUEUE_PICK_TIMEOUT_MINUTES,
} from "../constants/queue.constants";
import { broadcastCoachQueueToAll } from "./coach-realtime.service";
import { logger } from "../config/logger";

async function resolvePosterForOrganization(organization: string) {
  const profiles = await coachProfilesRepository.findByOrganization(organization);
  for (const profile of profiles) {
    const user = await usersRepository.findById(profile.userId);
    if (user?.isActive && (user.role === "coach" || user.role === "nutrition_coach")) {
      return user;
    }
  }
  const admins = await usersRepository.findByRole("admin");
  return admins.find((a) => a.isActive) ?? null;
}

async function resolveOrganizationForMeal(clientId: string, assignedCoachIds: string[]) {
  const consumer = await consumerProfilesRepository.findById(clientId);
  if (consumer?.userId) {
    const user = await usersRepository.findById(consumer.userId);
    if (user?.organizationId) {
      const org = await AppDataSource.getRepository(Organization).findOne({
        where: { id: user.organizationId },
      });
      if (org?.name?.trim()) return org.name.trim();
    }
  }

  for (const coachId of assignedCoachIds) {
    const profile = await coachProfilesRepository.findByUserId(coachId);
    if (profile?.organization?.trim()) return profile.organization.trim();
  }
  return null;
}

async function escalateMeal(mealId: string) {
  const meal = await mealsRepository.findMealById(mealId);
  if (!meal || meal.status !== "in_review") return;

  const pick = readQueuePick(meal);
  if (pick.pickedAt || pick.escalatedAt) return;
  if (!needsQueueEscalation(meal, QUEUE_PICK_TIMEOUT_MINUTES)) return;

  const consumer = await consumerProfilesRepository.findById(meal.clientId);
  const patientLabel =
    (typeof consumer?.profile?.displayName === "string" && consumer.profile.displayName) ||
    meal.clientId;
  const mealName =
    (typeof meal.data.mealName === "string" && meal.data.mealName) || "Untitled meal";
  const waiting = waitingMinutes(meal.submittedAt);

  writeQueuePick(meal, { escalatedAt: new Date().toISOString() });
  await mealsRepository.saveMeal(meal);

  const assignedRows = await coachAssignmentsRepository.findCoachIdsForClient(meal.clientId);
  const assignedCoachIds = assignedRows.map((r) => r.coachUserId);
  const organization = await resolveOrganizationForMeal(meal.clientId, assignedCoachIds);

  const body = `⏱ Review unclaimed for ${waiting}m — ${patientLabel} · “${mealName}”. No coach has picked this up yet. Someone available, please claim it from the review queue.`;

  if (organization) {
    try {
      const poster = await resolvePosterForOrganization(organization);
      if (poster) {
        const team = await chatService.ensureTeamChannel(poster);
        await chatService.sendMessage(poster, team.id, body, meal.id);
      }
    } catch (err) {
      logger.warn({ err, mealId, organization }, "Failed to post queue escalation to team channel");
    }
  }

  broadcastCoachQueueToAll({
    type: "queue_updated",
    reason: "escalated",
    mealId: meal.id,
    clientName: patientLabel,
    mealName,
  });

  logger.info({ mealId, waitingMinutes: waiting, organization }, "Queue item escalated to team");
}

export async function scanAndEscalateUnpickedQueueItems() {
  try {
    const meals = await mealsRepository.findAllMeals();
    const candidates = meals.filter((m) =>
      needsQueueEscalation(m, QUEUE_PICK_TIMEOUT_MINUTES),
    );
    for (const meal of candidates) {
      await escalateMeal(meal.id);
    }
  } catch (err) {
    logger.error({ err }, "Queue escalation scan failed");
  }
}

export function startQueueEscalationScheduler() {
  void scanAndEscalateUnpickedQueueItems();
  setInterval(() => void scanAndEscalateUnpickedQueueItems(), QUEUE_ESCALATION_INTERVAL_MS);
  logger.info(
    { intervalMs: QUEUE_ESCALATION_INTERVAL_MS, timeoutMinutes: QUEUE_PICK_TIMEOUT_MINUTES },
    "Queue escalation scheduler started",
  );
}
