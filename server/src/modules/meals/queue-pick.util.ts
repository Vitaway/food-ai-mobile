import type { MealSubmission } from "./meal-submission.entity";
import { waitingMinutes } from "./meal-effective.util";

export type QueuePickState = {
  pickedByCoachId?: string;
  pickedByCoachName?: string;
  pickedAt?: string;
  escalatedAt?: string;
};

export function readQueuePick(meal: MealSubmission): QueuePickState {
  const d = meal.data;
  return {
    pickedByCoachId:
      typeof d.queuePickedByCoachId === "string" ? d.queuePickedByCoachId : undefined,
    pickedByCoachName:
      typeof d.queuePickedByCoachName === "string" ? d.queuePickedByCoachName : undefined,
    pickedAt: typeof d.queuePickedAt === "string" ? d.queuePickedAt : undefined,
    escalatedAt: typeof d.queueEscalatedAt === "string" ? d.queueEscalatedAt : undefined,
  };
}

export function writeQueuePick(
  meal: MealSubmission,
  patch: Partial<QueuePickState> | null,
): MealSubmission {
  const next = { ...meal.data };
  if (patch === null) {
    delete next.queuePickedByCoachId;
    delete next.queuePickedByCoachName;
    delete next.queuePickedAt;
    delete next.queueEscalatedAt;
  } else {
    if ("pickedByCoachId" in patch) {
      if (patch.pickedByCoachId) next.queuePickedByCoachId = patch.pickedByCoachId;
      else delete next.queuePickedByCoachId;
    }
    if ("pickedByCoachName" in patch) {
      if (patch.pickedByCoachName) next.queuePickedByCoachName = patch.pickedByCoachName;
      else delete next.queuePickedByCoachName;
    }
    if ("pickedAt" in patch) {
      if (patch.pickedAt) next.queuePickedAt = patch.pickedAt;
      else delete next.queuePickedAt;
    }
    if ("escalatedAt" in patch) {
      if (patch.escalatedAt) next.queueEscalatedAt = patch.escalatedAt;
      else delete next.queueEscalatedAt;
    }
  }
  meal.data = next;
  return meal;
}

export function isQueuePicked(meal: MealSubmission): boolean {
  return Boolean(readQueuePick(meal).pickedAt);
}

export function needsQueueEscalation(
  meal: MealSubmission,
  timeoutMinutes: number,
  now = new Date(),
): boolean {
  if (meal.status !== "in_review") return false;
  const pick = readQueuePick(meal);
  if (pick.pickedAt || pick.escalatedAt) return false;
  return waitingMinutes(meal.submittedAt, now) >= timeoutMinutes;
}

export function queuePickFieldsForDto(meal: MealSubmission) {
  const pick = readQueuePick(meal);
  return {
    queuePickedByCoachId: pick.pickedByCoachId,
    queuePickedByCoachName: pick.pickedByCoachName,
    queuePickedAt: pick.pickedAt,
    queueEscalatedAt: pick.escalatedAt,
    queueIsPicked: Boolean(pick.pickedAt),
    queueNeedsPickup: Boolean(pick.escalatedAt && !pick.pickedAt),
  };
}
