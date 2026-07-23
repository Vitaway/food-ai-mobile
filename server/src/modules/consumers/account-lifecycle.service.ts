import bcrypt from "bcryptjs";
import { BadRequestError, NotFoundError } from "routing-controllers";
import { AppDataSource } from "../../config/database";
import { adminAuditService } from "../admin/admin-audit.service";
import { usersRepository } from "../users/users.repository";
import { consumerProfilesRepository } from "./consumer-profiles.repository";
import { mealsRepository } from "../meals/meals.repository";
import { mealCoachReviewsRepository } from "../meals/meal-coach-reviews.repository";
import { clinicalAssessmentsRepository } from "./clinical-assessments.repository";
import { ConsumerWaterLog } from "./water-log.entity";
import { logger } from "../../config/logger";

export const accountLifecycleService = {
  async exportForUser(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    const profile = await consumerProfilesRepository.findByUserId(userId);

    const meals = profile ? await mealsRepository.findMealsByClientId(profile.id) : [];
    const mealIds = meals.map((m) => m.id);
    const reviews = mealIds.length
      ? await mealCoachReviewsRepository.findByMealIds(mealIds)
      : [];
    const clinical = profile
      ? await clinicalAssessmentsRepository.findByClientId(profile.id)
      : null;
    const waterLogs = profile
      ? await AppDataSource.getRepository(ConsumerWaterLog).find({
          where: { clientId: profile.id },
          order: { createdAt: "ASC" },
        })
      : [];

    await adminAuditService.log(userId, "account.data_export", {
      targetType: "user",
      targetId: userId,
      meta: { mealCount: meals.length },
    });

    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt?.toISOString?.() ?? null,
      },
      profile: profile
        ? {
            patientId: profile.id,
            profile: profile.profile,
            dashboard: profile.dashboard,
            memberSince: profile.createdAt?.toISOString?.() ?? null,
            updatedAt: profile.updatedAt?.toISOString?.() ?? null,
          }
        : null,
      meals: meals.map((m) => ({
        id: m.id,
        mealType: m.mealType,
        status: m.status,
        submittedAt: m.submittedAt.toISOString(),
        data: m.data,
      })),
      mealReviews: reviews.map((r) => ({
        mealId: r.mealId,
        action: r.action,
        note: r.note,
        reviewedAt: r.reviewedAt?.toISOString?.() ?? null,
      })),
      clinicalAssessment: clinical
        ? {
            status: clinical.status,
            data: clinical.data,
            targetSnapshot: clinical.targetSnapshot,
            confirmedAt: clinical.confirmedAt?.toISOString() ?? null,
          }
        : null,
      waterLogs: waterLogs.map((w) => ({
        date: w.date,
        amountMl: w.amountMl,
        createdAt: w.createdAt.toISOString(),
      })),
    };
  },

  async deleteForUser(userId: string) {
    return this.deleteAccount(userId, userId, "self");
  },

  async deleteByAdmin(adminId: string, userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    if (user.role === "admin" || user.role === "super_admin") {
      throw new BadRequestError("Platform admin accounts cannot be deleted");
    }
    return this.deleteAccount(userId, adminId, "admin");
  },

  async deleteAccount(userId: string, actorId: string, source: "self" | "admin") {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    if (source === "self" && user.role !== "consumer") {
      throw new BadRequestError("Only consumer accounts can be self-deleted");
    }

    const profile = await consumerProfilesRepository.findByUserId(userId);
    const clientId = profile?.id;

    await adminAuditService.log(actorId, "account.delete_requested", {
      targetType: "user",
      targetId: userId,
      meta: { patientId: clientId ?? null, source },
    });

    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      await qr.query(
        `UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId],
      );

      for (const sql of [
        `DELETE FROM user_push_tokens WHERE user_id = $1`,
        `DELETE FROM user_notifications WHERE user_id = $1`,
        `DELETE FROM password_reset_otps WHERE user_id = $1`,
        `DELETE FROM family_subscription_members WHERE user_id = $1`,
      ]) {
        try {
          await qr.query(sql, [userId]);
        } catch {
          /* table may not exist in older DBs */
        }
      }

      if (clientId) {
        const mealIds: { id: string }[] = await qr.query(
          `SELECT id FROM meal_submissions WHERE client_id = $1`,
          [clientId],
        );
        const ids = mealIds.map((r) => r.id);
        if (ids.length) {
          for (const sql of [
            `DELETE FROM coach_review_drafts WHERE meal_id = ANY($1::uuid[])`,
            `DELETE FROM meal_review_tasks WHERE meal_id = ANY($1::uuid[])`,
            `DELETE FROM meal_coach_reviews WHERE meal_id = ANY($1::uuid[])`,
          ]) {
            try {
              await qr.query(sql, [ids]);
            } catch {
              /* ignore */
            }
          }
        }

        for (const sql of [
          `DELETE FROM meal_submissions WHERE client_id = $1`,
          `DELETE FROM consumer_water_logs WHERE client_id = $1`,
          `DELETE FROM consumer_daily_health_scores WHERE client_id = $1`,
          `DELETE FROM consumer_clinical_assessments WHERE client_id = $1`,
          `DELETE FROM coach_client_assignments WHERE client_id = $1`,
          `DELETE FROM cohort_members WHERE client_id = $1`,
          `DELETE FROM report_snapshots WHERE scope_type = 'consumer' AND scope_id = $1`,
          `DELETE FROM consumer_profiles WHERE id = $1`,
        ]) {
          try {
            await qr.query(sql, [clientId]);
          } catch {
            /* ignore missing tables */
          }
        }
      }

      try {
        await qr.query(`DELETE FROM coach_profiles WHERE user_id = $1`, [userId]);
      } catch {
        /* ignore */
      }

      try {
        await qr.query(
          `UPDATE subscriptions SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"deleted":true}'::jsonb, user_id = NULL WHERE user_id = $1`,
          [userId],
        );
      } catch {
        /* ignore */
      }

      const tombstoneEmail = `deleted+${userId.replace(/-/g, "").slice(0, 12)}@deleted.mirafood.local`;
      const lockedHash = await bcrypt.hash(`deleted-${userId}-${Date.now()}`, 10);
      await qr.query(
        `UPDATE users SET email = $2, display_name = 'Deleted user', password_hash = $3, avatar_url = NULL, is_active = false, referral_code = NULL, organization_id = NULL, updated_at = NOW() WHERE id = $1`,
        [userId, tombstoneEmail, lockedHash],
      );

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      logger.error({ err, userId }, "Account deletion failed");
      throw err;
    } finally {
      await qr.release();
    }

    await adminAuditService.log(actorId, "account.deleted", {
      targetType: "user",
      targetId: userId,
      meta: { source },
    });

    return { ok: true as const, deletedAt: new Date().toISOString() };
  },
};
