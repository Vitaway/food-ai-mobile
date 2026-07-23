import type { Request } from "express";
import { BadRequestError, ForbiddenError, NotFoundError } from "routing-controllers";
import { In } from "typeorm";
import { AppDataSource } from "../../config/database";
import type { User } from "../users/user.entity";
import { User as UserEntity } from "../users/user.entity";
import { Organization } from "../payments/organization.entity";
import { CoachProfile } from "../coaches/coach-profile.entity";
import { ConsumerProfile } from "../meals/consumer-profile.entity";
import { coachAssignmentsRepository } from "../coaches/coach-assignments.repository";
import { mealsRepository } from "../meals/meals.repository";
import { adminAuditService } from "./admin-audit.service";
import { moduleEntitlementsService } from "./module-entitlements.service";
import type { CreateOrganizationDto, UpdateOrganizationDto } from "./admin.dto";
import { reportsService, type ReportRangeInput } from "../reports/reports.service";

function mapOrganization(org: Organization, memberCount = 0) {
  return {
    id: org.id,
    name: org.name,
    status: org.status,
    contactEmail: org.contactEmail,
    contactPhone: org.contactPhone,
    notes: org.notes,
    memberCount,
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  };
}

export function isPlatformAdmin(role: string) {
  return role === "admin" || role === "super_admin";
}

export function assertPlatformAdmin(actor: User) {
  if (!isPlatformAdmin(actor.role)) {
    throw new ForbiddenError("Platform admin access required");
  }
}

export function assertCanAccessOrganization(actor: User, organizationId: string) {
  if (isPlatformAdmin(actor.role)) return;
  if (actor.role === "organization_admin" && actor.organizationId === organizationId) return;
  throw new ForbiddenError("Cannot access this organization");
}

export async function resolveOrganizationByIdOrName(opts: {
  organizationId?: string | null;
  organization?: string | null;
}): Promise<Organization | null> {
  const repo = AppDataSource.getRepository(Organization);
  if (opts.organizationId?.trim()) {
    const org = await repo.findOne({ where: { id: opts.organizationId.trim() } });
    if (!org) throw new BadRequestError("Organization not found");
    return org;
  }
  const name = opts.organization?.trim();
  if (!name) return null;
  const org = await repo
    .createQueryBuilder("o")
    .where("LOWER(o.name) = LOWER(:name)", { name })
    .getOne();
  if (!org) {
    throw new BadRequestError(
      "Organization not found. Create it under Organizations first, then select it.",
    );
  }
  return org;
}

export const organizationsService = {
  async list(actor: User) {
    const repo = AppDataSource.getRepository(Organization);
    let orgs: Organization[];
    if (isPlatformAdmin(actor.role)) {
      orgs = await repo.find({ order: { name: "ASC" } });
    } else if (actor.role === "organization_admin" && actor.organizationId) {
      const org = await repo.findOne({ where: { id: actor.organizationId } });
      orgs = org ? [org] : [];
    } else {
      throw new ForbiddenError("Insufficient permissions");
    }

    const userRepo = AppDataSource.getRepository(UserEntity);
    const counts =
      orgs.length === 0
        ? []
        : await userRepo
            .createQueryBuilder("u")
            .select("u.organization_id", "organizationId")
            .addSelect("COUNT(*)", "count")
            .where("u.organization_id IN (:...ids)", { ids: orgs.map((o) => o.id) })
            .groupBy("u.organization_id")
            .getRawMany<{ organizationId: string; count: string }>();

    const countById = new Map(counts.map((row) => [row.organizationId, Number(row.count)]));
    return orgs.map((org) => mapOrganization(org, countById.get(org.id) ?? 0));
  },

  async get(actor: User, organizationId: string) {
    assertCanAccessOrganization(actor, organizationId);
    const org = await AppDataSource.getRepository(Organization).findOne({
      where: { id: organizationId },
    });
    if (!org) throw new NotFoundError("Organization not found");

    const members = await AppDataSource.getRepository(UserEntity).find({
      where: { organizationId },
      order: { displayName: "ASC" },
      take: 500,
    });
    const userIds = members.map((m) => m.id);
    const consumers =
      userIds.length > 0
        ? await AppDataSource.getRepository(ConsumerProfile).find({
            where: { userId: In(userIds) },
          })
        : [];
    const coaches =
      userIds.length > 0
        ? await AppDataSource.getRepository(CoachProfile).find({
            where: { userId: In(userIds) },
          })
        : [];
    const consumerByUser = new Map(consumers.map((c) => [c.userId, c]));
    const coachByUser = new Map(coaches.map((c) => [c.userId, c]));

    return {
      ...mapOrganization(org, members.length),
      members: members.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
        patientId: consumerByUser.get(user.id)?.id ?? null,
        title: coachByUser.get(user.id)?.title ?? null,
        createdAt: user.createdAt.toISOString(),
      })),
    };
  },

  async create(actor: User, dto: CreateOrganizationDto, req?: Request) {
    assertPlatformAdmin(actor);
    const name = dto.name.trim();
    if (!name) throw new BadRequestError("Organization name is required");

    const repo = AppDataSource.getRepository(Organization);
    const existing = await repo
      .createQueryBuilder("o")
      .where("LOWER(o.name) = LOWER(:name)", { name })
      .getOne();
    if (existing) throw new BadRequestError("An organization with this name already exists");

    const org = await repo.save(
      repo.create({
        name,
        status: dto.status ?? "active",
        contactEmail: dto.contactEmail?.trim() || null,
        contactPhone: dto.contactPhone?.trim() || null,
        notes: dto.notes?.trim() || null,
      }),
    );

    await moduleEntitlementsService.ensureAccount(actor.id, org.name, req);

    await adminAuditService.log(actor.id, "organization.create", {
      targetType: "organization",
      targetId: org.id,
      meta: { name: org.name },
      req,
    });

    return mapOrganization(org, 0);
  },

  async update(actor: User, organizationId: string, dto: UpdateOrganizationDto, req?: Request) {
    assertCanAccessOrganization(actor, organizationId);
    if (!isPlatformAdmin(actor.role)) {
      // Org admins can update contact/notes only — not rename/status.
      if (dto.name != null || dto.status != null) {
        throw new ForbiddenError("Only platform admins can rename or change organization status");
      }
    }

    const repo = AppDataSource.getRepository(Organization);
    const org = await repo.findOne({ where: { id: organizationId } });
    if (!org) throw new NotFoundError("Organization not found");

    const previousName = org.name;
    if (dto.name != null) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestError("Organization name is required");
      const clash = await repo
        .createQueryBuilder("o")
        .where("LOWER(o.name) = LOWER(:name)", { name })
        .andWhere("o.id <> :id", { id: organizationId })
        .getOne();
      if (clash) throw new BadRequestError("An organization with this name already exists");
      org.name = name;
    }
    if (dto.status != null) org.status = dto.status;
    if (dto.contactEmail !== undefined) org.contactEmail = dto.contactEmail?.trim() || null;
    if (dto.contactPhone !== undefined) org.contactPhone = dto.contactPhone?.trim() || null;
    if (dto.notes !== undefined) org.notes = dto.notes?.trim() || null;

    await repo.save(org);

    if (org.name !== previousName) {
      // Keep coach profile free-text keys in sync for legacy entitlement/chat lookups.
      await AppDataSource.getRepository(CoachProfile)
        .createQueryBuilder()
        .update(CoachProfile)
        .set({ organization: org.name })
        .where(
          "user_id IN (SELECT id FROM users WHERE organization_id = :organizationId)",
          { organizationId },
        )
        .execute();
    }

    await adminAuditService.log(actor.id, "organization.update", {
      targetType: "organization",
      targetId: org.id,
      meta: { fields: Object.keys(dto), name: org.name },
      req,
    });

    const memberCount = await AppDataSource.getRepository(UserEntity).count({
      where: { organizationId },
    });
    return mapOrganization(org, memberCount);
  },

  async metrics(actor: User, organizationId: string) {
    assertCanAccessOrganization(actor, organizationId);
    const org = await AppDataSource.getRepository(Organization).findOne({
      where: { id: organizationId },
    });
    if (!org) throw new NotFoundError("Organization not found");

    const members = await AppDataSource.getRepository(UserEntity).find({
      where: { organizationId },
    });
    const patientRoles = new Set(["consumer", "organization_admin"]);
    const coachRoles = new Set(["coach", "nutrition_coach"]);
    const patientUserIds = members.filter((m) => patientRoles.has(m.role)).map((m) => m.id);

    const consumers =
      patientUserIds.length > 0
        ? await AppDataSource.getRepository(ConsumerProfile).find({
            where: { userId: In(patientUserIds) },
          })
        : [];
    const clientIds = new Set(consumers.map((c) => c.id));

    const allMeals = await mealsRepository.findAllMeals();
    const orgMeals = allMeals.filter((m) => clientIds.has(m.clientId));

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const mealsInReview = orgMeals.filter((m) => m.status === "in_review").length;
    const mealsAnalyzing = orgMeals.filter((m) => m.status === "analyzing").length;
    const mealsThisWeek = orgMeals.filter((m) => m.submittedAt >= weekAgo).length;
    const activeClientIds = new Set(
      orgMeals.filter((m) => m.submittedAt >= weekAgo).map((m) => m.clientId),
    );
    const inactivePatients = consumers.filter((c) => !activeClientIds.has(c.id)).length;

    const assignments = await coachAssignmentsRepository.findAll();
    const assignedClientIds = new Set(assignments.map((a) => a.clientId));
    const unassignedPatients = consumers.filter((c) => !assignedClientIds.has(c.id)).length;

    return {
      organizationId: org.id,
      organizationName: org.name,
      members: {
        total: members.length,
        patients: members.filter((m) => m.role === "consumer").length,
        coaches: members.filter((m) => coachRoles.has(m.role)).length,
        orgAdmins: members.filter((m) => m.role === "organization_admin").length,
        active: members.filter((m) => m.isActive).length,
      },
      patients: {
        total: consumers.length,
        inactive: inactivePatients,
        unassigned: unassignedPatients,
      },
      meals: {
        total: orgMeals.length,
        inReview: mealsInReview,
        analyzing: mealsAnalyzing,
        thisWeek: mealsThisWeek,
      },
      timestamp: new Date().toISOString(),
    };
  },

  async generateReport(actor: User, organizationId: string, range: ReportRangeInput) {
    assertCanAccessOrganization(actor, organizationId);
    const org = await AppDataSource.getRepository(Organization).findOne({
      where: { id: organizationId },
    });
    if (!org) throw new NotFoundError("Organization not found");

    const members = await AppDataSource.getRepository(UserEntity).find({
      where: { organizationId },
    });
    const patientRoles = new Set(["consumer", "organization_admin"]);
    const coachRoles = new Set(["coach", "nutrition_coach"]);
    const patientUserIds = members.filter((m) => patientRoles.has(m.role)).map((m) => m.id);
    const consumers =
      patientUserIds.length > 0
        ? await AppDataSource.getRepository(ConsumerProfile).find({
            where: { userId: In(patientUserIds) },
          })
        : [];

    const snapshot = await reportsService.generateOrganizationSnapshot(
      org.id,
      org.name,
      {
        clientIds: consumers.map((c) => c.id),
        coachCount: members.filter((m) => coachRoles.has(m.role)).length,
        patientCount: consumers.length,
      },
      range,
    );

    return {
      id: snapshot.id,
      period: snapshot.period,
      periodStart: snapshot.periodStart,
      periodEnd: snapshot.periodEnd,
      metrics: snapshot.metrics,
      createdAt: snapshot.createdAt.toISOString(),
    };
  },
};
