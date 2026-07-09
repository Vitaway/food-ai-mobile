import { ForbiddenError } from "routing-controllers";
import { coachAssignmentsRepository } from "../coaches/coach-assignments.repository";
import { cohortsRepository } from "../coaches/cohorts.repository";
import { chatRepository } from "../chat/chat.repository";
import { mealsRepository } from "./meals.repository";
import { mealCoachReviewsRepository } from "./meal-coach-reviews.repository";
import type { MealSubmission } from "./meal-submission.entity";

const SLA_WARNING_MINUTES = 60;
const SLA_CRITICAL_MINUTES = 24 * 60;

export { SLA_WARNING_MINUTES, SLA_CRITICAL_MINUTES };

/** Explicit coach–patient assignments only (empty when none — never “all patients”). */
export async function resolveCoachCaseloadIds(
  coachUserId: string,
  cohortId?: string,
): Promise<Set<string>> {
  const assignments = await coachAssignmentsRepository.findByCoachUserId(coachUserId);
  let clientIds = new Set(assignments.map((a) => a.clientId));

  if (cohortId) {
    const cohortClientIds = await cohortsRepository.clientIdsInCohort(cohortId);
    const cohortSet = new Set(cohortClientIds);
    clientIds = new Set([...clientIds].filter((id) => cohortSet.has(id)));
  }

  return clientIds;
}

/** Review queue stays open to the whole team; only optional cohort filter applies. */
export async function resolveCoachQueueClientIds(
  cohortId?: string,
): Promise<Set<string> | null> {
  if (!cohortId) return null;
  const cohortClientIds = await cohortsRepository.clientIdsInCohort(cohortId);
  return new Set(cohortClientIds);
}

/** @deprecated Use resolveCoachCaseloadIds or resolveCoachQueueClientIds */
export async function resolveCoachClientIds(
  coachUserId: string,
  cohortId?: string,
): Promise<Set<string> | null> {
  return resolveCoachQueueClientIds(cohortId);
}

export function filterMealsForCoach(
  meals: MealSubmission[],
  clientIds: Set<string> | null,
) {
  if (!clientIds) return meals;
  return meals.filter((m) => clientIds.has(m.clientId));
}

export function filterConsumersForCoach<T extends { id: string }>(
  consumers: T[],
  clientIds: Set<string>,
) {
  return consumers.filter((c) => clientIds.has(c.id));
}

export function slaLevel(waitingMinutes: number): "ok" | "warning" | "critical" {
  if (waitingMinutes >= SLA_CRITICAL_MINUTES) return "critical";
  if (waitingMinutes >= SLA_WARNING_MINUTES) return "warning";
  return "ok";
}

/**
 * Caseload is explicit-only (no auto-assign on review or message).
 * Coaches may still open queue meals, existing chats, or patients they already reviewed.
 */
export async function ensureCoachCanAccessClient(coachUserId: string, clientId: string) {
  const caseload = await resolveCoachCaseloadIds(coachUserId);
  if (caseload.has(clientId)) return;

  const meals = await mealsRepository.findMealsByClientId(clientId);
  if (meals.some((m) => m.status === "in_review")) return;

  const conversation = await chatRepository.findPatientConversation(coachUserId, clientId);
  if (conversation) return;

  const coachReviews = await mealCoachReviewsRepository.findByCoachId(coachUserId);
  const mealIds = new Set(meals.map((m) => m.id));
  if (coachReviews.some((r) => mealIds.has(r.mealId))) return;

  throw new ForbiddenError(
    "This patient is not on your caseload. Add them explicitly when you take ownership.",
  );
}
