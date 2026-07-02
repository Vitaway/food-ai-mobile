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
import type { CreateCoachDto, SetUserActiveDto } from "./admin.dto";

export const adminService = {
  async metrics() {
    const meals = await mealsRepository.findAllMeals();
    const inReview = meals.filter((m) => m.status === "in_review").length;
    const analyzing = meals.filter((m) => m.status === "analyzing").length;
    const approved = meals.filter((m) => m.status === "approved").length;
    const consumers = await mealsRepository.findAllConsumers();
    const health = healthService.getStatus();

    return {
      coaches: await usersRepository.countByRole("coach"),
      consumers: consumers.length,
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
};
