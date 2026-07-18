import { NotFoundError, ForbiddenError, BadRequestError } from "routing-controllers";
import { mealsRepository } from "../meals/meals.repository";
import { consumerProfilesRepository } from "./consumer-profiles.repository";
import { usersRepository } from "../users/users.repository";
import { ensureUserReferralCode } from "../users/referral.util";
import { notificationsService } from "../notifications/notifications.service";
import { broadcastCoachQueueToAll } from "../../services/coach-realtime.service";
import { saveConsumerAvatar, saveMealPhoto } from "../../services/uploads.service";
import type { UpdateConsumerProfileDto, SubmitConsumerMealDto, LogWaterDto } from "./consumer.dto";
import { computeDashboard, todayKey } from "./dashboard.util";
import { backfillOnboardingComplete, resolveOnboardingComplete } from "./onboarding.util";
import { mealCoachReviewsRepository } from "../meals/meal-coach-reviews.repository";
import { mealToConsumerDto } from "../meals/meal-effective.util";
import { annotateManualReviewFallback } from "../meals/ai-fallback.util";
import { normalizeMealItems, asDetectedItems } from "../meals/nutrition.util";
import { assessMealAllergens } from "../meals/allergen-match.util";
import { assertConsumerSubscription } from "../../middlewares/entitlements";
import { AppDataSource } from "../../config/database";
import { ConsumerDailyHealthScore } from "./daily-health-score.entity";
import { ensureConsumerProfileForUser } from "./ensure-consumer-profile.util";
import { clinicalAssessmentsRepository } from "./clinical-assessments.repository";
import {
  calculateTargetsForProfile,
  profileWithCalculatedTargets,
} from "./profile-targets.util";
import { waterLogsRepository } from "./water-logs.repository";
import { ageFromDateOfBirth, isValidDateOfBirth } from "./date-of-birth.util";

const CALCULATION_FIELDS = new Set([
  "age",
  "dateOfBirth",
  "sex",
  "heightCm",
  "weightKg",
  "goal",
  "activityLevel",
  "targetWeightKg",
  "goalPace",
]);

async function syncUserFields(userId: string, fields: { displayName?: string; avatarUrl?: string | null }) {
  const user = await usersRepository.findById(userId);
  if (!user) return;

  let changed = false;
  if (fields.displayName !== undefined && fields.displayName !== user.displayName) {
    user.displayName = fields.displayName;
    changed = true;
  }
  if (fields.avatarUrl !== undefined && fields.avatarUrl !== user.avatarUrl) {
    user.avatarUrl = fields.avatarUrl || null;
    changed = true;
  }
  if (changed) {
    await usersRepository.save(user);
  }
}

function mealToDto(
  row: {
    id: string;
    clientId: string;
    mealType: string;
    status: string;
    submittedAt: Date;
    data: Record<string, unknown>;
  },
  review?: Awaited<ReturnType<typeof mealCoachReviewsRepository.findByMealId>>,
) {
  return mealToConsumerDto(
    {
      id: row.id,
      clientId: row.clientId,
      mealType: row.mealType,
      status: row.status,
      submittedAt: row.submittedAt,
      data: row.data,
    } as import("../meals/meal-submission.entity").MealSubmission,
    review ?? null,
  );
}

async function mealsWithReviews(
  meals: Awaited<ReturnType<typeof mealsRepository.findMealsByClientId>>,
) {
  const reviews = await mealCoachReviewsRepository.findByMealIds(meals.map((m) => m.id));
  const byMealId = new Map(reviews.map((r) => [r.mealId, r]));
  return { meals, byMealId };
}

export const consumerService = {
  async requireProfileForUser(userId: string) {
    return ensureConsumerProfileForUser(userId);
  },

  async getProfile(userId: string) {
    const row = await this.requireProfileForUser(userId);
    if (isValidDateOfBirth(row.profile.dateOfBirth)) {
      const currentAge = ageFromDateOfBirth(row.profile.dateOfBirth);
      if (row.profile.age !== currentAge) {
        const assessment = await clinicalAssessmentsRepository.findByClientId(row.id);
        const status = assessment?.status ?? "incomplete";
        const source = { ...row.profile, age: currentAge };
        const calculation = calculateTargetsForProfile(source, assessment?.data ?? {}, status);
        row.profile = profileWithCalculatedTargets(source, calculation, status);
        row.profile.onboardingComplete = resolveOnboardingComplete(row.profile);
        await consumerProfilesRepository.save(row);
      }
    }
    const profile = await backfillOnboardingComplete(row.profile, async (next) => {
      row.profile = next;
      await consumerProfilesRepository.save(row);
    });
    return {
      patientId: row.id,
      userId: row.userId,
      profile: {
        ...profile,
        onboardingComplete: resolveOnboardingComplete(profile),
      },
      memberSince: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  },

  async updateProfile(userId: string, dto: UpdateConsumerProfileDto) {
    const row = await this.requireProfileForUser(userId);
    // Clinical outputs are server-owned. Older mobile clients may still send
    // these properties; deliberately ignore them and recalculate below.
    const patientFields: Record<string, unknown> = {};
    const editableFields: Array<keyof UpdateConsumerProfileDto> = [
      "displayName",
      "avatarUrl",
      "age",
      "dateOfBirth",
      "sex",
      "heightCm",
      "weightKg",
      "goal",
      "activityLevel",
      "dietaryPreferences",
      "allergies",
      "targetWeightKg",
      "goalPace",
      "mealsPerDay",
    ];
    for (const key of editableFields) {
      if (dto[key] !== undefined) patientFields[key] = dto[key];
    }
    let nextProfile = { ...row.profile, ...patientFields };
    if (dto.dateOfBirth !== undefined) {
      if (!isValidDateOfBirth(dto.dateOfBirth)) {
        throw new BadRequestError("dateOfBirth must be a valid past date in YYYY-MM-DD format");
      }
      const age = ageFromDateOfBirth(dto.dateOfBirth);
      if (age < 13 || age > 120) {
        throw new BadRequestError("Patient must be between 13 and 120 years old");
      }
      nextProfile.age = age;
    }
    if (dto.displayName !== undefined) {
      nextProfile.displayName = dto.displayName;
    }
    if (dto.avatarUrl !== undefined) {
      nextProfile.avatarUrl = dto.avatarUrl;
    }
    const assessment = await clinicalAssessmentsRepository.findByClientId(row.id);
    const calculationChanged = Object.keys(patientFields).some((key) => CALCULATION_FIELDS.has(key));
    let assessmentStatus = assessment?.status ?? "incomplete";
    if (assessment?.status === "confirmed" && calculationChanged) {
      assessment.status = "draft";
      assessment.confirmedBy = null;
      assessment.confirmedAt = null;
      assessmentStatus = "draft";
    }

    const calculation = calculateTargetsForProfile(
      nextProfile,
      assessment?.data ?? {},
      assessmentStatus,
    );
    if (assessment && calculationChanged) {
      assessment.targetSnapshot = calculation as unknown as Record<string, unknown> | null;
      await clinicalAssessmentsRepository.save(assessment);
    }
    nextProfile = profileWithCalculatedTargets(nextProfile, calculation, assessmentStatus);
    nextProfile.onboardingComplete = resolveOnboardingComplete(nextProfile);
    row.profile = nextProfile;
    await consumerProfilesRepository.save(row);

    await syncUserFields(userId, {
      displayName: dto.displayName,
      avatarUrl: dto.avatarUrl,
    });

    return this.getProfile(userId);
  },

  async uploadAvatar(userId: string, buffer: Buffer, mimeType: string, req?: import("express").Request) {
    const { avatarUrl } = saveConsumerAvatar(buffer, mimeType, userId, req);
    return this.updateProfile(userId, { avatarUrl });
  },

  async uploadMealPhoto(
    userId: string,
    mealId: string,
    buffer: Buffer,
    mimeType: string,
    req?: import("express").Request,
  ) {
    const row = await this.requireProfileForUser(userId);
    const { imageUrl } = saveMealPhoto(buffer, mimeType, mealId, row.id, req);

    const meal = await mealsRepository.findMealByIdForClient(mealId, row.id);
    if (meal) {
      meal.data = { ...meal.data, imageUrl };
      await mealsRepository.saveMeal(meal);
    }

    return { mealId, imageUrl };
  },

  async updateDashboardCache(userId: string, patch: Record<string, unknown>) {
    const row = await this.requireProfileForUser(userId);
    row.dashboard = { ...row.dashboard, ...patch };
    await consumerProfilesRepository.save(row);
    return row.dashboard;
  },

  async getDashboard(userId: string, date?: string) {
    const row = await this.requireProfileForUser(userId);
    const targetDate = date ?? todayKey();
    const meals = await mealsRepository.findMealsByClientId(row.id);
    const reviews = await mealCoachReviewsRepository.findByMealIds(meals.map((m) => m.id));
    const byMealId = new Map(reviews.map((r) => [r.mealId, r]));
    const waterMl = await waterLogsRepository.totalForDate(row.id, targetDate);
    const dashboard = computeDashboard(
      row.profile,
      { ...row.dashboard, waterMl },
      meals,
      byMealId,
      targetDate,
    );
    const repo = AppDataSource.getRepository(ConsumerDailyHealthScore);
    await repo.upsert(
      {
        clientId: row.id,
        date: dashboard.date,
        nutrientScore: String(dashboard.healthScoreBreakdown.nutrientScore),
        macroScore: String(dashboard.healthScoreBreakdown.macroScore),
        calorieScore: String(dashboard.healthScoreBreakdown.calorieScore),
        consistencyScore: String(dashboard.healthScoreBreakdown.consistencyScore),
        varietyScore: String(dashboard.healthScoreBreakdown.varietyScore),
        totalScore: String(dashboard.healthScore),
        context: {
          caloriesConsumed: dashboard.caloriesConsumed,
          calorieTarget: dashboard.calorieTarget,
          macrosConsumed: dashboard.macrosConsumed,
        },
      },
      ["clientId", "date"],
    );
    return dashboard;
  },

  async listMeals(userId: string) {
    const row = await this.requireProfileForUser(userId);
    const meals = await mealsRepository.findMealsByClientId(row.id);
    const { byMealId } = await mealsWithReviews(meals);
    return meals.map((m) => mealToDto(m, byMealId.get(m.id)));
  },

  async getMeal(userId: string, mealId: string) {
    const row = await this.requireProfileForUser(userId);
    const meal = await mealsRepository.findMealByIdForClient(mealId, row.id);
    if (!meal) {
      throw new NotFoundError("Meal not found");
    }
    const review = await mealCoachReviewsRepository.findByMealId(mealId);
    return mealToDto(meal, review ?? undefined);
  },

  async submitMeal(
    userId: string,
    dto: SubmitConsumerMealDto,
    imageBuffer?: Buffer,
    mimeType?: string,
    req?: import("express").Request,
  ) {
    await assertConsumerSubscription(userId);
    const row = await this.requireProfileForUser(userId);
    const status = dto.status === "approved" ? "in_review" : dto.status;
    const data = annotateManualReviewFallback({ ...dto.data });
    if (Array.isArray(data.items)) {
      data.items = normalizeMealItems(data.items);
    }
    data.allergenAssessment = assessMealAllergens(
      row.profile?.allergies,
      asDetectedItems(data.items),
    );

    const storedUrl = data.imageUrl;
    if (
      typeof storedUrl === "string" &&
      (storedUrl.startsWith("file:") ||
        storedUrl.startsWith("content:") ||
        storedUrl.startsWith("ph://"))
    ) {
      delete data.imageUrl;
    }

    if (imageBuffer?.length) {
      const { imageUrl } = saveMealPhoto(
        imageBuffer,
        mimeType ?? "image/jpeg",
        dto.id,
        row.id,
        req,
      );
      data.imageUrl = imageUrl;
    }

    await mealsRepository.upsertMeal({
      id: dto.id,
      clientId: row.id,
      status,
      mealType: dto.mealType,
      submittedAt: new Date(dto.submittedAt),
      data,
    });

    const meal = await this.getMeal(userId, dto.id);

    if (status === "in_review") {
      const mealName = (dto.data.mealName as string | undefined) ?? undefined;
      void notificationsService.notifyMealStatus(userId, {
        id: dto.id,
        mealName,
        status,
      });
      const profileName =
        typeof row.profile?.displayName === "string" ? row.profile.displayName.trim() : "";
      const clientName = profileName ? profileName.split(/\s+/)[0] : "Patient";
      broadcastCoachQueueToAll({
        type: "queue_updated",
        reason: "submitted",
        mealId: dto.id,
        mealName: mealName ?? dto.mealType ?? "Meal",
        mealType: dto.mealType,
        clientName,
      });
    }

    return meal;
  },

  async logWater(userId: string, dto: LogWaterDto) {
    const amountMl = Math.round(dto.amountMl);
    if (!Number.isFinite(amountMl) || amountMl === 0 || Math.abs(amountMl) > 5000) {
      throw new BadRequestError("amountMl must be between -5000 and 5000 (not 0)");
    }

    const date = dto.date ?? todayKey();
    if (date !== todayKey()) {
      throw new BadRequestError("Only today's water intake can be logged for now");
    }

    const row = await this.requireProfileForUser(userId);
    const current = await waterLogsRepository.totalForDate(row.id, date);
    const next = Math.max(0, current + amountMl);
    const appliedMl = next - current;
    if (appliedMl !== 0) {
      await waterLogsRepository.save(waterLogsRepository.create(row.id, date, appliedMl));
    }
    row.dashboard = { ...row.dashboard, waterMl: next };
    await consumerProfilesRepository.save(row);

    return {
      date,
      waterMl: next,
      waterTargetMl: Number(row.profile.waterTargetMl ?? 0),
      addedMl: appliedMl,
    };
  },

  async getReferral(userId: string) {
    const code = await ensureUserReferralCode(userId);
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const referralCount = await usersRepository.countReferrals(userId);
    let referredBy: { displayName: string; joinedAt: string } | null = null;

    if (user.referredByUserId) {
      const referrer = await usersRepository.findById(user.referredByUserId);
      if (referrer) {
        referredBy = {
          displayName: referrer.displayName,
          joinedAt: user.createdAt.toISOString(),
        };
      }
    }

    return {
      referralCode: code,
      referralCount,
      referredBy,
    };
  },

  async getHealthScoreHistory(userId: string, days = 30) {
    const row = await this.requireProfileForUser(userId);
    const repo = AppDataSource.getRepository(ConsumerDailyHealthScore);
    const limit = Math.max(1, Math.min(90, days));
    const data = await repo.find({
      where: { clientId: row.id },
      order: { date: "DESC" },
      take: limit,
    });
    return data.map((entry) => ({
      date: entry.date,
      totalScore: Number(entry.totalScore),
      nutrientScore: Number(entry.nutrientScore),
      macroScore: Number(entry.macroScore),
      calorieScore: Number(entry.calorieScore),
      consistencyScore: Number(entry.consistencyScore),
      varietyScore: Number(entry.varietyScore),
    }));
  },

  async assertMealOwner(userId: string, clientId: string) {
    const row = await this.requireProfileForUser(userId);
    if (row.id !== clientId) {
      throw new ForbiddenError("Not allowed to access this meal");
    }
  },
};
