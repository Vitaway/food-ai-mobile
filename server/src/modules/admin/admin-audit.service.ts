import type { Request } from "express";
import { AppDataSource } from "../../config/database";
import { AdminAuditLog } from "./admin-audit.entity";

export const adminAuditService = {
  async log(
    adminUserId: string,
    action: string,
    options?: {
      targetType?: string;
      targetId?: string;
      meta?: Record<string, unknown>;
      req?: Request;
    },
  ) {
    const repo = AppDataSource.getRepository(AdminAuditLog);
    const entry = repo.create({
      adminUserId,
      action,
      targetType: options?.targetType ?? null,
      targetId: options?.targetId ?? null,
      meta: options?.meta ?? null,
      ip: options?.req?.ip ?? null,
    });
    await repo.save(entry);
  },

  async recent(limit = 20) {
    const repo = AppDataSource.getRepository(AdminAuditLog);
    return repo.find({
      order: { createdAt: "DESC" },
      take: limit,
    });
  },
};
