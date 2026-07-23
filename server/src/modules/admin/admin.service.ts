import bcrypt from "bcryptjs";
import type { Request } from "express";
import { BadRequestError, ForbiddenError, NotFoundError } from "routing-controllers";
import { usersRepository } from "../users/users.repository";
import { coachProfilesRepository } from "../coaches/coach-profiles.repository";
import { coachAssignmentsRepository } from "../coaches/coach-assignments.repository";
import { mealsRepository } from "../meals/meals.repository";
import { healthService } from "../health/health.service";
import { claudeService } from "../ai/claude.service";
import { adminAuditService } from "./admin-audit.service";
import { emailService } from "../../services/email.service";
import { logger } from "../../config/logger";
import { env } from "../../config/env";
import type { CreateCoachDto, CreateAdminUserDto, SetUserActiveDto, SetUserRoleDto, UpdateAdminUserDto, AdminResetPasswordDto, UpdateConsumerProfileAdminDto, UpdateCoachProfileAdminDto } from "./admin.dto";
import { AppDataSource } from "../../config/database";
import { PaymentTransaction } from "../payments/payment-transaction.entity";
import { Subscription } from "../payments/subscription.entity";
import { ReportSnapshot } from "../reports/report-snapshot.entity";
import { User } from "../users/user.entity";
import { MealSubmission } from "../meals/meal-submission.entity";
import { consumerProfilesRepository } from "../consumers/consumer-profiles.repository";
import { authRepository } from "../auth/auth.repository";
import { generatePatientId } from "../../utils/patient-id";
import { generateReferralCode } from "../../utils/referral-code";
import { ensureConsumerProfileForUser } from "../consumers/ensure-consumer-profile.util";
import { accountLifecycleService } from "../consumers/account-lifecycle.service";
import { normalizePhone } from "../../utils/phone.util";
import { In } from "typeorm";
import { ConsumerProfile } from "../meals/consumer-profile.entity";
import { CoachProfile } from "../coaches/coach-profile.entity";
import { Organization } from "../payments/organization.entity";
import type { UserRole } from "../../middlewares/auth.middleware";
import { moduleEntitlementsService } from "./module-entitlements.service";
import {
  isPlatformAdmin,
  resolveOrganizationByIdOrName,
} from "./organizations.service";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function mapUserSummary(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    membershipTier: user.membershipTier ?? "standard",
    registrationSource: user.registrationSource,
    avatarUrl: user.avatarUrl,
    referralCode: user.referralCode,
    referredByUserId: user.referredByUserId,
    organizationId: user.organizationId,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function assertCanManageTarget(actor: User, target: User) {
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

function assertAssignableRole(actor: User, nextRole: string) {
  if (isPlatformAdmin(actor.role)) return;
  if (actor.role === "organization_admin") {
    if (
      nextRole === "admin" ||
      nextRole === "super_admin" ||
      nextRole === "organization_admin" ||
      nextRole === "data_entry_staff"
    ) {
      throw new ForbiddenError("Organization admins cannot assign this account type");
    }
    return;
  }
  throw new ForbiddenError("Insufficient permissions");
}

async function applyOrganizationToUser(
  user: User,
  opts: { organizationId?: string | null; organization?: string | null },
  options?: { required?: boolean },
) {
  const org = await resolveOrganizationByIdOrName({
    organizationId: opts.organizationId,
    organization: opts.organization,
  });
  if (!org) {
    if (options?.required) {
      throw new BadRequestError("Organization is required");
    }
    return null;
  }
  user.organizationId = org.id;
  return org;
}

async function applyRoleTransition(
  adminId: string,
  user: User,
  nextRole: UserRole,
  opts: { organization?: string; organizationId?: string; title?: string },
  req?: Request,
) {
  const coachRoles: UserRole[] = ["coach", "nutrition_coach"];
  const org = await applyOrganizationToUser(
    user,
    { organizationId: opts.organizationId, organization: opts.organization },
    { required: nextRole === "organization_admin" },
  );
  const orgName = org?.name;

  user.role = nextRole;

  if (nextRole === "consumer" || nextRole === "organization_admin") {
    await ensureConsumerProfileForUser(user.id);
    if (!user.referralCode) {
      let referralCode = generateReferralCode();
      while (await usersRepository.findByReferralCode(referralCode)) {
        referralCode = generateReferralCode();
      }
      user.referralCode = referralCode;
    }
  }

  if (coachRoles.includes(nextRole)) {
    let coach = await coachProfilesRepository.findByUserId(user.id);
    const defaultTitle =
      nextRole === "nutrition_coach" ? "Clinical Nutrition Coach" : "Nutrition Coach";
    if (!coach) {
      await coachProfilesRepository.save(
        coachProfilesRepository.create({
          userId: user.id,
          title: opts.title?.trim() || defaultTitle,
          organization: orgName || "Vitaway",
          bio: null,
          phone: null,
          timezone: "Africa/Kigali",
        }),
      );
    } else {
      if (orgName) coach.organization = orgName;
      if (opts.title?.trim()) coach.title = opts.title.trim();
      await coachProfilesRepository.save(coach);
    }
  }

  if (nextRole === "organization_admin" && orgName) {
    await moduleEntitlementsService.ensureAccount(adminId, orgName, req);
  }
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
    const userIds = consumers.map((c) => c.userId).filter((id): id is string => Boolean(id));
    const userRepo = AppDataSource.getRepository(User);
    const linkedUsers =
      userIds.length > 0
        ? await userRepo
            .createQueryBuilder("u")
            .where("u.id IN (:...userIds)", { userIds })
            .getMany()
        : [];
    const tierByUserId = new Map(linkedUsers.map((u) => [u.id, u.membershipTier ?? "standard"]));

    return consumers.map((c) => {
      const profile = c.profile as Record<string, unknown>;
      const dashboard = c.dashboard as Record<string, unknown>;
      return {
        id: c.id,
        patientId: c.id,
        userId: c.userId,
        displayName: profile.displayName ?? c.id,
        email: profile.email ?? null,
        goal: profile.goal ?? null,
        healthScore: dashboard.healthScore ?? null,
        membershipTier: c.userId ? (tierByUserId.get(c.userId) ?? "standard") : "standard",
        memberSince: c.createdAt.toISOString(),
      };
    });
  },

  async listUsers(actor: User) {
    const userRepo = AppDataSource.getRepository(User);
    const users =
      actor.role === "organization_admin"
        ? actor.organizationId
          ? await userRepo.find({
              where: { organizationId: actor.organizationId },
              order: { createdAt: "DESC" },
              take: 500,
            })
          : []
        : await userRepo.find({ order: { createdAt: "DESC" }, take: 500 });
    const userIds = users.map((user) => user.id);

    const consumerProfiles =
      userIds.length > 0
        ? await AppDataSource.getRepository(ConsumerProfile).find({
            where: { userId: In(userIds) },
          })
        : [];
    const coachProfiles =
      userIds.length > 0
        ? await AppDataSource.getRepository(CoachProfile).find({
            where: { userId: In(userIds) },
          })
        : [];
    const orgIds = [...new Set(users.map((u) => u.organizationId).filter(Boolean))] as string[];
    const organizations =
      orgIds.length > 0
        ? await AppDataSource.getRepository(Organization).find({ where: { id: In(orgIds) } })
        : [];

    const consumerByUserId = new Map(consumerProfiles.map((profile) => [profile.userId, profile]));
    const coachByUserId = new Map(coachProfiles.map((profile) => [profile.userId, profile]));
    const orgById = new Map(organizations.map((org) => [org.id, org]));

    return users.map((user) => {
      const consumer = consumerByUserId.get(user.id);
      const coach = coachByUserId.get(user.id);
      const org = user.organizationId ? orgById.get(user.organizationId) : null;
      const profile = consumer?.profile as Record<string, unknown> | undefined;
      const dashboard = consumer?.dashboard as Record<string, unknown> | undefined;

      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        membershipTier: user.membershipTier ?? "standard",
        registrationSource: user.registrationSource,
        createdAt: user.createdAt.toISOString(),
        patientId: consumer?.id ?? null,
        goal: (profile?.goal as string | undefined) ?? null,
        healthScore: (dashboard?.healthScore as number | undefined) ?? null,
        organizationId: user.organizationId,
        organization: org?.name ?? coach?.organization ?? null,
        title: coach?.title ?? null,
      };
    });
  },

  async getUserDetail(actor: User, userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    assertCanManageTarget(actor, user);

    const subscriptionRepo = AppDataSource.getRepository(Subscription);
    const subscription = await subscriptionRepo.findOne({
      where: { userId: user.id },
      order: { createdAt: "DESC" },
    });

    const consumerProfile = await consumerProfilesRepository.findByUserId(user.id);
    const coachProfile = await coachProfilesRepository.findByUserId(user.id);
    const organization = user.organizationId
      ? await AppDataSource.getRepository(Organization).findOne({
          where: { id: user.organizationId },
        })
      : null;

    let meals: MealSubmission[] = [];
    let mealStats = { total: 0, inReview: 0, approved: 0, rejected: 0, analyzing: 0 };
    if (consumerProfile) {
      meals = await mealsRepository.findMealsByClientId(consumerProfile.id);
      mealStats = {
        total: meals.length,
        inReview: meals.filter((m) => m.status === "in_review").length,
        approved: meals.filter((m) => m.status === "approved").length,
        rejected: meals.filter((m) => m.status === "rejected").length,
        analyzing: meals.filter((m) => m.status === "analyzing").length,
      };
    }

    const referralCount = await usersRepository.countReferrals(user.id);

    const recentMeals = meals
      .slice()
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, 15)
      .map((meal) => ({
        id: meal.id,
        clientId: meal.clientId,
        status: meal.status,
        mealType: meal.mealType,
        mealName: String(meal.data.mealName ?? "Meal"),
        submittedAt: meal.submittedAt.toISOString(),
        calories: Number((meal.data.totalNutrition as Record<string, unknown> | undefined)?.calories ?? 0),
      }));

    let assignedCoachIds: string[] = [];
    if (consumerProfile) {
      const assignments = await coachAssignmentsRepository.findByClientId(consumerProfile.id);
      assignedCoachIds = assignments.map((a) => a.coachUserId);
    }

    return {
      user: mapUserSummary(user),
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            status: organization.status,
          }
        : null,
      consumerProfile: consumerProfile
        ? {
            id: consumerProfile.id,
            patientId: consumerProfile.id,
            profile: consumerProfile.profile,
            dashboard: consumerProfile.dashboard,
            createdAt: consumerProfile.createdAt.toISOString(),
            updatedAt: consumerProfile.updatedAt.toISOString(),
          }
        : null,
      coachProfile: coachProfile
        ? {
            id: coachProfile.id,
            title: coachProfile.title,
            organization: coachProfile.organization,
            bio: coachProfile.bio,
            phone: coachProfile.phone,
            timezone: coachProfile.timezone,
            createdAt: coachProfile.createdAt.toISOString(),
            updatedAt: coachProfile.updatedAt.toISOString(),
          }
        : null,
      subscription: subscription
        ? {
            id: subscription.id,
            planCode: subscription.planCode,
            subscriptionType: subscription.subscriptionType,
            status: subscription.status,
            renewsOn: subscription.renewsOn,
            trialEndsOn: subscription.trialEndsOn,
            createdAt: subscription.createdAt.toISOString(),
          }
        : null,
      stats: {
        referralCount,
        meals: mealStats,
      },
      assignedCoachIds,
      recentMeals,
    };
  },

  async updateUser(adminId: string, actor: User, userId: string, dto: UpdateAdminUserDto, req?: Request) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    assertCanManageTarget(actor, user);

    if (dto.email) {
      const email = dto.email.toLowerCase().trim();
      const existing = await usersRepository.findByEmail(email);
      if (existing && existing.id !== user.id) {
        throw new BadRequestError("Another account already uses this email");
      }
      user.email = email;
    }

    if (dto.displayName != null) user.displayName = dto.displayName.trim();
    if (dto.phone !== undefined) user.phone = normalizePhone(dto.phone === "" ? null : dto.phone);
    if (dto.isActive != null) {
      if (user.role === "admin" && !dto.isActive) {
        throw new BadRequestError("Cannot deactivate platform admin accounts");
      }
      if (actor.role === "organization_admin" && user.role === "organization_admin") {
        throw new BadRequestError("Organization admins cannot deactivate other organization admins");
      }
      user.isActive = dto.isActive;
    }
    if (dto.role != null && dto.role !== user.role) {
      if (user.id === adminId && dto.role !== "admin") {
        throw new BadRequestError("Cannot change your own admin role");
      }
      assertAssignableRole(actor, dto.role);
      const organizationId =
        actor.role === "organization_admin" ? actor.organizationId ?? undefined : dto.organizationId;
      await applyRoleTransition(
        adminId,
        user,
        dto.role,
        {
          organization: dto.organization,
          organizationId: organizationId ?? undefined,
          title: dto.title,
        },
        req,
      );
    } else if (dto.role != null) {
      user.role = dto.role;
    }

    if (dto.organizationId != null || dto.organization != null) {
      if (actor.role === "organization_admin") {
        // Org admins can keep members in their org, or detach them (individual).
        if (dto.organizationId === "" || dto.organization === "") {
          if (user.organizationId !== actor.organizationId) {
            throw new ForbiddenError("Can only remove members of your own organization");
          }
          if (user.role === "organization_admin") {
            throw new BadRequestError("Cannot remove an organization admin from the organization");
          }
          user.organizationId = null;
          const coach = await coachProfilesRepository.findByUserId(user.id);
          if (coach) {
            coach.organization = "Independent";
            await coachProfilesRepository.save(coach);
          }
        } else {
          user.organizationId = actor.organizationId;
        }
      } else if (dto.organizationId === "" || dto.organization === "") {
        user.organizationId = null;
        const coach = await coachProfilesRepository.findByUserId(user.id);
        if (coach) {
          coach.organization = "Independent";
          await coachProfilesRepository.save(coach);
        }
      } else {
        const org = await applyOrganizationToUser(user, {
          organizationId: dto.organizationId,
          organization: dto.organization,
        });
        if (org) {
          const coach = await coachProfilesRepository.findByUserId(user.id);
          if (coach) {
            coach.organization = org.name;
            await coachProfilesRepository.save(coach);
          }
          if (user.role === "organization_admin") {
            await moduleEntitlementsService.ensureAccount(adminId, org.name, req);
            await ensureConsumerProfileForUser(user.id);
          }
        }
      }
    }

    if (dto.membershipTier != null) {
      if (actor.role === "organization_admin") {
        throw new ForbiddenError("Organization admins cannot change membership tier");
      }
      user.membershipTier = dto.membershipTier;
    }

    await usersRepository.save(user);

    if (dto.displayName && (user.role === "consumer" || user.role === "organization_admin")) {
      const profile = await consumerProfilesRepository.findByUserId(user.id);
      if (profile) {
        profile.profile = {
          ...profile.profile,
          displayName: user.displayName,
          email: user.email,
          phone: user.phone,
        };
        await consumerProfilesRepository.save(profile);
      }
    } else if (dto.phone !== undefined && (user.role === "consumer" || user.role === "organization_admin")) {
      const profile = await consumerProfilesRepository.findByUserId(user.id);
      if (profile) {
        profile.profile = { ...profile.profile, phone: user.phone };
        await consumerProfilesRepository.save(profile);
      }
    }

    await adminAuditService.log(adminId, "user.update", {
      targetType: "user",
      targetId: userId,
      meta: {
        email: user.email,
        role: user.role,
        membershipTier: user.membershipTier,
        organizationId: user.organizationId,
        isActive: user.isActive,
      },
      req,
    });

    return mapUserSummary(user);
  },

  async updateConsumerProfile(
    adminId: string,
    actor: User,
    userId: string,
    dto: UpdateConsumerProfileAdminDto,
    req?: Request,
  ) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    assertCanManageTarget(actor, user);
    const profile = await consumerProfilesRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError("Consumer profile not found");

    const next = { ...profile.profile };
    if (dto.displayName != null) {
      next.displayName = dto.displayName.trim();
      user.displayName = dto.displayName.trim();
      await usersRepository.save(user);
    }
    if (dto.goal != null) next.goal = dto.goal;
    if (dto.goalPace != null) next.goalPace = dto.goalPace;
    if (dto.allergies != null) next.allergies = dto.allergies;
    if (dto.notes != null) next.adminNotes = dto.notes;
    next.updatedAt = new Date().toISOString();

    profile.profile = next;
    await consumerProfilesRepository.save(profile);

    await adminAuditService.log(adminId, "consumer.profile_update", {
      targetType: "consumer",
      targetId: profile.id,
      meta: { userId, fields: Object.keys(dto) },
      req,
    });

    return {
      id: profile.id,
      profile: profile.profile,
      dashboard: profile.dashboard,
    };
  },

  async updateCoachProfileAdmin(
    adminId: string,
    actor: User,
    userId: string,
    dto: UpdateCoachProfileAdminDto,
    req?: Request,
  ) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    assertCanManageTarget(actor, user);
    let profile = await coachProfilesRepository.findByUserId(userId);
    if (!profile) {
      profile = coachProfilesRepository.create({
        userId,
        title: dto.title?.trim() || "Nutrition Coach",
        organization: dto.organization?.trim() || "Vitaway",
        bio: dto.bio?.trim() || null,
        phone: dto.phone?.trim() || null,
        timezone: dto.timezone?.trim() || "Africa/Kigali",
      });
    } else {
      if (dto.title != null) profile.title = dto.title.trim() || null;
      if (dto.organization != null) profile.organization = dto.organization.trim() || null;
      if (dto.bio != null) profile.bio = dto.bio.trim() || null;
      if (dto.phone != null) profile.phone = dto.phone.trim() || null;
      if (dto.timezone != null) profile.timezone = dto.timezone.trim() || null;
    }
    await coachProfilesRepository.save(profile);

    if (dto.organization != null && isPlatformAdmin(actor.role)) {
      const org = await resolveOrganizationByIdOrName({ organization: dto.organization });
      if (org) {
        user.organizationId = org.id;
        await usersRepository.save(user);
      }
    }

    await adminAuditService.log(adminId, "coach.profile_update", {
      targetType: "user",
      targetId: userId,
      meta: { fields: Object.keys(dto) },
      req,
    });

    return {
      id: profile.id,
      title: profile.title,
      organization: profile.organization,
      bio: profile.bio,
      phone: profile.phone,
      timezone: profile.timezone,
    };
  },

  async resetUserPassword(
    adminId: string,
    actor: User,
    userId: string,
    dto: AdminResetPasswordDto,
    req?: Request,
  ) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    assertCanManageTarget(actor, user);
    if (!user.passwordHash) {
      throw new BadRequestError("This account does not use password login");
    }

    const newPassword = dto.password?.trim() || generateTempPassword();
    if (newPassword.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await usersRepository.save(user);
    const revoked = await authRepository.revokeAllForUser(user.id);

    const sendEmail = dto.sendEmail !== false;
    if (sendEmail) {
      try {
        await emailService.sendAdminPasswordResetEmail(user.email, {
          displayName: user.displayName,
          temporaryPassword: newPassword,
        });
      } catch (err) {
        logger.error({ err, email: user.email }, "Failed to send admin password reset email");
        if (env.NODE_ENV === "production") {
          throw new BadRequestError("Password was reset but email could not be sent");
        }
      }
    }

    await adminAuditService.log(adminId, "user.password_reset", {
      targetType: "user",
      targetId: userId,
      meta: { email: user.email, emailSent: sendEmail, revokedSessions: revoked },
      req,
    });

    return {
      ok: true as const,
      emailSent: sendEmail,
      revokedSessions: revoked,
      ...(env.NODE_ENV !== "production" && !sendEmail ? { temporaryPassword: newPassword } : {}),
    };
  },

  async createUser(adminId: string, actor: User, dto: CreateAdminUserDto, req?: Request) {
    assertAssignableRole(actor, dto.role);

    const email = dto.email.toLowerCase().trim();
    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestError("A user with this email already exists");
    }

    const forcedOrgId =
      actor.role === "organization_admin" ? actor.organizationId ?? undefined : dto.organizationId;
    const org = await resolveOrganizationByIdOrName({
      organizationId: forcedOrgId,
      organization: actor.role === "organization_admin" ? undefined : dto.organization,
    });
    if (dto.role === "organization_admin" && !org) {
      throw new BadRequestError("Organization is required for organization admin accounts");
    }
    if (actor.role === "organization_admin" && !org) {
      throw new BadRequestError("Your account has no organization assigned");
    }

    const plainPassword = dto.password?.trim() || generateTempPassword();
    if (plainPassword.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters");
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    let referralCode: string | null = null;
    if (dto.role === "consumer" || dto.role === "organization_admin") {
      referralCode = generateReferralCode();
      while (await usersRepository.findByReferralCode(referralCode)) {
        referralCode = generateReferralCode();
      }
    }

    const user = usersRepository.create({
      email,
      passwordHash,
      role: dto.role,
      displayName: dto.displayName.trim(),
      avatarUrl: null,
      isActive: true,
      membershipTier: dto.membershipTier ?? "standard",
      registrationSource: dto.registrationSource ?? "admin_created",
      referralCode,
      referredByUserId: null,
      organizationId: org?.id ?? null,
    });
    await usersRepository.save(user);

    let patientId: string | null = null;
    let consumerProfile: Awaited<ReturnType<typeof consumerProfilesRepository.save>> | null = null;
    let coachProfile: Awaited<ReturnType<typeof coachProfilesRepository.save>> | null = null;

    if (dto.role === "consumer" || dto.role === "organization_admin") {
      const ensured = await ensureConsumerProfileForUser(user.id);
      patientId = ensured.id;
      consumerProfile = ensured;
      if (dto.role === "consumer") {
        const profileData = { ...ensured.profile };
        if (dto.goal?.trim()) profileData.goal = dto.goal.trim();
        if (dto.allergies?.length) profileData.allergies = dto.allergies;
        profileData.updatedAt = new Date().toISOString();
        ensured.profile = profileData;
        consumerProfile = await consumerProfilesRepository.save(ensured);
      }
    }

    if (dto.role === "coach" || dto.role === "nutrition_coach") {
      coachProfile = await coachProfilesRepository.save(
        coachProfilesRepository.create({
          userId: user.id,
          title:
            dto.title?.trim() ||
            (dto.role === "nutrition_coach" ? "Clinical Nutrition Coach" : "Nutrition Coach"),
          organization: org?.name || dto.organization?.trim() || "Vitaway",
          bio: dto.bio?.trim() || null,
          phone: null,
          timezone: "Africa/Kigali",
        }),
      );
    }

    if (dto.role === "organization_admin" && org) {
      await moduleEntitlementsService.ensureAccount(adminId, org.name, req);
    }

    const sendEmail = dto.sendInviteEmail !== false;
    let emailSent = false;
    if (sendEmail) {
      try {
        if (dto.role === "consumer") {
          await emailService.sendWelcomeEmail(user.email, {
            displayName: user.displayName,
            patientId: patientId!,
          });
        } else if (dto.role === "coach" || dto.role === "nutrition_coach") {
          await emailService.sendCoachInviteEmail(user.email, {
            displayName: user.displayName,
            temporaryPassword: plainPassword,
            organization: coachProfile?.organization,
          });
        } else {
          await emailService.sendStaffInviteEmail(user.email, {
            displayName: user.displayName,
            temporaryPassword: plainPassword,
            role: dto.role,
            organization: org?.name || dto.organization?.trim() || null,
          });
        }
        emailSent = true;
      } catch (err) {
        logger.error({ err, email: user.email, role: dto.role }, "Failed to send user invite email");
      }
    }

    await adminAuditService.log(adminId, "user.create", {
      targetType: "user",
      targetId: user.id,
      meta: {
        email,
        displayName: user.displayName,
        role: user.role,
        organizationId: user.organizationId,
        organization: org?.name || null,
        emailSent,
      },
      req,
    });

    const shouldShareTempPassword =
      !dto.password?.trim() && (env.NODE_ENV !== "production" || (sendEmail && !emailSent));

    return {
      user: mapUserSummary(user),
      patientId,
      consumerProfile: consumerProfile
        ? {
            id: consumerProfile.id,
            patientId: consumerProfile.id,
          }
        : null,
      coachProfile: coachProfile
        ? {
            id: coachProfile.id,
            title: coachProfile.title,
            organization: coachProfile.organization,
            bio: coachProfile.bio,
            phone: coachProfile.phone,
            timezone: coachProfile.timezone,
          }
        : null,
      emailSent,
      ...(shouldShareTempPassword ? { temporaryPassword: plainPassword } : {}),
    };
  },

  async createCoach(adminId: string, actor: User, dto: CreateCoachDto, req?: Request) {
    const created = await this.createUser(
      adminId,
      actor,
      {
        email: dto.email,
        password: dto.password,
        displayName: dto.displayName,
        role: "coach",
        title: dto.title,
        organization: dto.organization,
        bio: dto.bio,
        sendInviteEmail: true,
      },
      req,
    );

    const profile = created.coachProfile;
    if (!profile) {
      throw new BadRequestError("Coach profile was not created");
    }

    return {
      id: created.user.id,
      email: created.user.email,
      displayName: created.user.displayName,
      isActive: created.user.isActive,
      memberSince: created.user.createdAt,
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

  async setUserActive(adminId: string, actor: User, userId: string, dto: SetUserActiveDto, req?: Request) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    assertCanManageTarget(actor, user);
    if (user.role === "admin") {
      throw new BadRequestError("Cannot deactivate platform admin accounts");
    }
    if (actor.role === "organization_admin" && user.role === "organization_admin") {
      throw new BadRequestError("Organization admins cannot deactivate other organization admins");
    }
    user.isActive = dto.isActive;
    await usersRepository.save(user);

    await adminAuditService.log(adminId, "user.active_change", {
      targetType: "user",
      targetId: userId,
      meta: { isActive: user.isActive },
      req,
    });

    return mapUserSummary(user);
  },

  async deleteUser(adminId: string, actor: User, userId: string, req?: Request) {
    if (!isPlatformAdmin(actor.role)) {
      throw new ForbiddenError("Only platform admins can delete accounts");
    }
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    if (user.id === adminId) {
      throw new BadRequestError("Cannot delete your own account");
    }
    if (user.role === "admin" || user.role === "super_admin") {
      throw new BadRequestError("Cannot delete platform admin accounts");
    }

    const result = await accountLifecycleService.deleteByAdmin(adminId, userId);
    await adminAuditService.log(adminId, "user.delete", {
      targetType: "user",
      targetId: userId,
      meta: { email: user.email, role: user.role },
      req,
    });
    return result;
  },

  async systemStatus() {
    const readiness = await healthService.getReadiness();
    const runtime = healthService.getRuntimeMetrics();
    return {
      readiness,
      runtime,
      anthropic: {
        apiKeyStatus: claudeService.getApiKeyStatus(),
        model: env.ANTHROPIC_MODEL,
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

  async setUserRole(adminId: string, actor: User, userId: string, dto: SetUserRoleDto, req?: Request) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    assertCanManageTarget(actor, user);
    assertAssignableRole(actor, dto.role);
    if (user.id === adminId && dto.role !== "admin") {
      throw new BadRequestError("Cannot change your own admin role");
    }

    const previousRole = user.role;
    if (previousRole !== dto.role) {
      const organizationId =
        actor.role === "organization_admin" ? actor.organizationId ?? undefined : dto.organizationId;
      await applyRoleTransition(
        adminId,
        user,
        dto.role,
        {
          organization: dto.organization,
          organizationId: organizationId ?? undefined,
          title: dto.title,
        },
        req,
      );
      await usersRepository.save(user);
    }

    await adminAuditService.log(adminId, "user.role_change", {
      targetType: "user",
      targetId: userId,
      meta: {
        previousRole,
        role: dto.role,
        organizationId: user.organizationId,
        organization: dto.organization?.trim() || null,
      },
      req,
    });

    const consumerProfile = await consumerProfilesRepository.findByUserId(user.id);
    const coachProfile = await coachProfilesRepository.findByUserId(user.id);
    const organization = user.organizationId
      ? await AppDataSource.getRepository(Organization).findOne({
          where: { id: user.organizationId },
        })
      : null;

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      organizationId: user.organizationId,
      organization: organization?.name ?? coachProfile?.organization ?? null,
      patientId: consumerProfile?.id ?? null,
    };
  },
};
