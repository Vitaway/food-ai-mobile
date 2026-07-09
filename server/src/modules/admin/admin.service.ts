import bcrypt from "bcryptjs";
import type { Request } from "express";
import { BadRequestError, NotFoundError } from "routing-controllers";
import { usersRepository } from "../users/users.repository";
import { coachProfilesRepository } from "../coaches/coach-profiles.repository";
import { mealsRepository } from "../meals/meals.repository";
import { healthService } from "../health/health.service";
import { openRouterService } from "../ai/openrouter.service";
import { adminAuditService } from "./admin-audit.service";
import { emailService } from "../../services/email.service";
import { logger } from "../../config/logger";
import type { CreateCoachDto, SetUserActiveDto, SetUserRoleDto } from "./admin.dto";
import { AppDataSource } from "../../config/database";
import { PaymentTransaction } from "../payments/payment-transaction.entity";
import { Subscription } from "../payments/subscription.entity";
import { ReportSnapshot } from "../reports/report-snapshot.entity";
import { User } from "../users/user.entity";
import { MealSubmission } from "../meals/meal-submission.entity";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export const adminService = {
  async metrics() {
    const meals = await mealsRepository.findAllMeals();
    const inReview = meals.filter((m) => m.status === "in_review").length;
    const analyzing = meals.filter((m) => m.status === "analyzing").length;
    const approved = meals.filter((m) => m.status === "approved").length;
    const consumers = await mealsRepository.findAllConsumers();
    const health = healthService.getStatus();

    const transactionRepo = AppDataSource.getRepository(PaymentTransaction);
    const subscriptionRepo = AppDataSource.getRepository(Subscription);
    const reportRepo = AppDataSource.getRepository(ReportSnapshot);
    const recentTransactions = await transactionRepo.find({ order: { createdAt: "DESC" }, take: 200 });
    const revenue = recentTransactions
      .filter((payment) => payment.status === "succeeded")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const reportsCount = await reportRepo.count();

    const userRepo = AppDataSource.getRepository(User);
    const totalUsers = await userRepo.count();
    const weekAgo = daysAgo(7);
    const monthAgo = daysAgo(30);
    const newRegistrationsWeek = await userRepo
      .createQueryBuilder("u")
      .where("u.created_at >= :weekAgo", { weekAgo })
      .getCount();
    const newRegistrationsMonth = await userRepo
      .createQueryBuilder("u")
      .where("u.created_at >= :monthAgo", { monthAgo })
      .getCount();

    const mealRepo = AppDataSource.getRepository(MealSubmission);
    const activeUsersWeek = await mealRepo
      .createQueryBuilder("m")
      .select("COUNT(DISTINCT m.client_id)", "count")
      .where("m.submitted_at >= :weekAgo", { weekAgo })
      .getRawOne<{ count: string }>();

    const referredUsers = await userRepo
      .createQueryBuilder("u")
      .where("u.referred_by_user_id IS NOT NULL")
      .getCount();

    const sourceRows = await userRepo
      .createQueryBuilder("u")
      .select("COALESCE(u.registration_source, 'individual')", "source")
      .addSelect("COUNT(*)", "count")
      .groupBy("COALESCE(u.registration_source, 'individual')")
      .getRawMany<{ source: string; count: string }>();

    const userSources = {
      individual: 0,
      company: 0,
      institution: 0,
      referral: referredUsers,
      direct: 0,
    };
    for (const row of sourceRows) {
      const key = row.source as keyof typeof userSources;
      if (key in userSources) userSources[key] = Number(row.count);
    }
    userSources.direct = Math.max(0, totalUsers - referredUsers);

    const subscriptionsByType = {
      individual: await subscriptionRepo.count({ where: { subscriptionType: "individual", status: "active" } }),
      corporate: await subscriptionRepo.count({ where: { subscriptionType: "corporate", status: "active" } }),
      family: await subscriptionRepo.count({ where: { subscriptionType: "family", status: "active" } }),
    };

    return {
      coaches: await usersRepository.countByRole("coach"),
      consumers: consumers.length,
      totalUsers,
      activeUsersWeek: Number(activeUsersWeek?.count ?? 0),
      newRegistrationsWeek,
      newRegistrationsMonth,
      userSources: {
        ...userSources,
        referral: referredUsers,
      },
      meals: {
        total: meals.length,
        inReview,
        analyzing,
        approved,
      },
      vision: {
        ok: health.ok,
        apiKeyStatus: health.apiKeyStatus,
        model: health.model,
      },
      payments: {
        activeSubscriptions: await subscriptionRepo.count({ where: { status: "active" } }),
        pendingPayments: recentTransactions.filter((payment) => payment.status === "pending").length,
        failedPayments: recentTransactions.filter((payment) => payment.status === "failed").length,
        revenue: Math.round(revenue * 100) / 100,
        subscriptionsByType,
      },
      reports: {
        totalSnapshots: reportsCount,
      },
      timestamp: new Date().toISOString(),
    };
  },

  async listCoaches() {
    const coaches = await usersRepository.findByRole("coach");
    const rows = [];
    for (const coach of coaches) {
      const profile = await coachProfilesRepository.findByUserId(coach.id);
      rows.push({
        id: coach.id,
        email: coach.email,
        displayName: coach.displayName,
        isActive: coach.isActive,
        memberSince: coach.createdAt.toISOString(),
        profile: profile
          ? {
              id: profile.id,
              title: profile.title,
              organization: profile.organization,
              bio: profile.bio,
              phone: profile.phone,
              timezone: profile.timezone,
            }
          : null,
      });
    }
    return rows;
  },

  async listConsumers() {
    const consumers = await mealsRepository.findAllConsumers();
    return consumers.map((c) => {
      const profile = c.profile as Record<string, unknown>;
      const dashboard = c.dashboard as Record<string, unknown>;
      return {
        id: c.id,
        patientId: c.id,
        displayName: profile.displayName ?? c.id,
        email: profile.email ?? null,
        goal: profile.goal ?? null,
        healthScore: dashboard.healthScore ?? null,
        memberSince: c.createdAt.toISOString(),
      };
    });
  },

  async listUsers() {
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find({ order: { createdAt: "DESC" }, take: 500 });
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      registrationSource: user.registrationSource,
      createdAt: user.createdAt.toISOString(),
    }));
  },

  async createCoach(adminId: string, dto: CreateCoachDto, req?: Request) {
    const email = dto.email.toLowerCase().trim();
    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestError("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = usersRepository.create({
      email,
      passwordHash,
      role: "coach",
      displayName: dto.displayName.trim(),
      avatarUrl: null,
      isActive: true,
    });
    await usersRepository.save(user);

    const profile = coachProfilesRepository.create({
      userId: user.id,
      title: dto.title?.trim() || "Nutrition Coach",
      organization: dto.organization?.trim() || "Vitaway",
      bio: dto.bio?.trim() || null,
      phone: null,
      timezone: "Africa/Kigali",
    });
    await coachProfilesRepository.save(profile);

    await adminAuditService.log(adminId, "coach.create", {
      targetType: "user",
      targetId: user.id,
      meta: { email, displayName: user.displayName },
      req,
    });

    try {
      await emailService.sendCoachInviteEmail(user.email, {
        displayName: user.displayName,
        temporaryPassword: dto.password,
        organization: profile.organization,
      });
    } catch (err) {
      logger.error({ err, email: user.email }, "Failed to send coach invite email");
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      memberSince: user.createdAt.toISOString(),
      profile: {
        id: profile.id,
        title: profile.title,
        organization: profile.organization,
        bio: profile.bio,
        phone: profile.phone,
        timezone: profile.timezone,
      },
    };
  },

  async setUserActive(adminId: string, userId: string, dto: SetUserActiveDto, req?: Request) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    if (user.role === "admin") {
      throw new BadRequestError("Cannot deactivate platform admin accounts");
    }

    user.isActive = dto.isActive;
    await usersRepository.save(user);

    await adminAuditService.log(adminId, dto.isActive ? "user.activate" : "user.deactivate", {
      targetType: "user",
      targetId: userId,
      meta: { email: user.email, role: user.role },
      req,
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
    };
  },

  async systemStatus() {
    const readiness = await healthService.getReadiness();
    const runtime = healthService.getRuntimeMetrics();
    return {
      readiness,
      runtime,
      openRouter: {
        apiKeyStatus: openRouterService.getApiKeyStatus(),
      },
    };
  },

  async auditLogs() {
    const logs = await adminAuditService.recent(30);
    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      meta: log.meta,
      createdAt: log.createdAt.toISOString(),
    }));
  },

  async referralStats() {
    const userRepo = AppDataSource.getRepository(User);
    const referrers = await userRepo
      .createQueryBuilder("u")
      .where("u.referral_code IS NOT NULL")
      .orderBy("u.created_at", "DESC")
      .take(100)
      .getMany();

    const rows = [];
    for (const user of referrers) {
      rows.push({
        userId: user.id,
        displayName: user.displayName,
        referralCode: user.referralCode,
        referralCount: await usersRepository.countReferrals(user.id),
      });
    }
    return rows;
  },

  async growthSeries(days = 30) {
    const userRepo = AppDataSource.getRepository(User);
    const start = daysAgo(days);
    const rows = await userRepo
      .createQueryBuilder("u")
      .select("DATE(u.created_at)", "date")
      .addSelect("COUNT(*)", "count")
      .where("u.created_at >= :start", { start })
      .groupBy("DATE(u.created_at)")
      .orderBy("DATE(u.created_at)", "ASC")
      .getRawMany<{ date: string; count: string }>();

    const byDate = new Map(rows.map((row) => [String(row.date).slice(0, 10), Number(row.count)]));
    const points = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const key = d.toISOString().slice(0, 10);
      points.push({ date: key, registrations: byDate.get(key) ?? 0 });
    }
    return points;
  },

  async setUserRole(adminId: string, userId: string, dto: SetUserRoleDto, req?: Request) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    if (user.id === adminId && dto.role !== "admin") {
      throw new BadRequestError("Cannot change your own admin role");
    }
    user.role = dto.role;
    await usersRepository.save(user);
    await adminAuditService.log(adminId, "user.role_change", {
      targetType: "user",
      targetId: userId,
      meta: { role: dto.role },
      req,
    });
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  },
};
