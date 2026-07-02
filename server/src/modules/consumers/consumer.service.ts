import { NotFoundError, ForbiddenError, BadRequestError } from "routing-controllers";
import { mealsRepository } from "../meals/meals.repository";
import { consumerProfilesRepository } from "./consumer-profiles.repository";
import { usersRepository } from "../users/users.repository";
import { ensureUserReferralCode } from "../users/referral.util";
import { notificationsService } from "../notifications/notifications.service";
import type { UpdateConsumerProfileDto, SubmitConsumerMealDto, LogWaterDto } from "./consumer.dto";
import { computeDashboard, todayKey } from "./dashboard.util";

function mealToDto(row: {
  id: string;
  clientId: string;
  mealType: string;
  status: string;
  submittedAt: Date;
  data: Record<string, unknown>;
}) {
  return {
    id: row.id,
    clientId: row.clientId,
    mealType: row.mealType,
    status: row.status,
    submittedAt: row.submittedAt.toISOString(),
    ...row.data,
  };
}

export const consumerService = {
  async requireProfileForUser(userId: string) {
    const profile = await consumerProfilesRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError("Consumer profile not found");
    }
    return profile;
  },

  async getProfile(userId: string) {
    const row = await this.requireProfileForUser(userId);
    return {
      patientId: row.id,
      userId: row.userId,
      profile: row.profile,
      memberSince: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  },

  async updateProfile(userId: string, dto: UpdateConsumerProfileDto) {
    const row = await this.requireProfileForUser(userId);
    const nextProfile = { ...row.profile, ...dto };
    if (dto.displayName !== undefined) {
      nextProfile.displayName = dto.displayName;
    }
    row.profile = nextProfile;
    await consumerProfilesRepository.save(row);
    return this.getProfile(userId);
  },

  async updateDashboardCache(userId: string, patch: Record<string, unknown>) {
    const row = await this.requireProfileForUser(userId);
    row.dashboard = { ...row.dashboard, ...patch };
    await consumerProfilesRepository.save(row);
    return row.dashboard;
  },

  async getDashboard(userId: string) {
    const row = await this.requireProfileForUser(userId);
    const meals = await mealsRepository.findMealsByClientId(row.id);
    return computeDashboard(row.profile, row.dashboard, meals);
  },

  async listMeals(userId: string) {
    const row = await this.requireProfileForUser(userId);
    const meals = await mealsRepository.findMealsByClientId(row.id);
    return meals.map(mealToDto);
  },

  async getMeal(userId: string, mealId: string) {
    const row = await this.requireProfileForUser(userId);
    const meal = await mealsRepository.findMealByIdForClient(mealId, row.id);
    if (!meal) {
      throw new NotFoundError("Meal not found");
    }
    return mealToDto(meal);
  },

  async submitMeal(userId: string, dto: SubmitConsumerMealDto) {
    const row = await this.requireProfileForUser(userId);
    const status = dto.status === "approved" ? "in_review" : dto.status;

    await mealsRepository.upsertMeal({
      id: dto.id,
      clientId: row.id,
      status,
      mealType: dto.mealType,
      submittedAt: new Date(dto.submittedAt),
      data: dto.data,
    });

    const meal = await this.getMeal(userId, dto.id);

    if (status === "in_review") {
      const mealName = (dto.data.mealName as string | undefined) ?? undefined;
      void notificationsService.notifyMealStatus(userId, {
        id: dto.id,
        mealName,
        status,
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
    const current = Number(row.dashboard.waterMl ?? 0);
    const next = Math.max(0, current + amountMl);
    row.dashboard = { ...row.dashboard, waterMl: next };
    await consumerProfilesRepository.save(row);

    return {
      date,
      waterMl: next,
      waterTargetMl: Number(row.profile.waterTargetMl ?? 2000),
      addedMl: amountMl,
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

  async assertMealOwner(userId: string, clientId: string) {
    const row = await this.requireProfileForUser(userId);
    if (row.id !== clientId) {
      throw new ForbiddenError("Not allowed to access this meal");
    }
  },
};
