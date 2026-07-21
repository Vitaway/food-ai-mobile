import { ForbiddenError, NotFoundError } from "routing-controllers";
import { generatePatientId } from "../../utils/patient-id";
import { logger } from "../../config/logger";
import { usersRepository } from "../users/users.repository";
import { consumerProfilesRepository } from "./consumer-profiles.repository";
import { autoAssignCoachForClient } from "../coaches/coach-auto-assign.util";
import type { ConsumerProfile } from "../meals/consumer-profile.entity";

/** Returns an existing consumer profile or creates a minimal one for consumer-role users. */
export async function ensureConsumerProfileForUser(userId: string): Promise<ConsumerProfile> {
  const existing = await consumerProfilesRepository.findByUserId(userId);
  if (existing) return existing;

  const user = await usersRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (user.role !== "consumer" && user.role !== "organization_admin") {
    throw new ForbiddenError("Consumer profile not found");
  }

  let patientId = generatePatientId();
  while (await consumerProfilesRepository.findById(patientId)) {
    patientId = generatePatientId();
  }

  const now = new Date().toISOString();
  const profile = consumerProfilesRepository.create({
    id: patientId,
    userId: user.id,
    profile: {
      displayName: user.displayName,
      email: user.email,
      onboardingComplete: false,
      createdAt: now,
      updatedAt: now,
    },
    dashboard: {
      waterMl: 0,
      streakDays: 0,
    },
  });

  const saved = await consumerProfilesRepository.save(profile);
  try {
    await autoAssignCoachForClient(saved.id, user);
  } catch (err) {
    logger.warn({ err, clientId: saved.id }, "Auto-assign coach failed for new patient");
  }
  return saved;
}
