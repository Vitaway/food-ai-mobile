import { ForbiddenError } from "routing-controllers";
import { AppDataSource } from "../config/database";
import { env } from "../config/env";
import { Subscription } from "../modules/payments/subscription.entity";
import { FamilySubscriptionMember } from "../modules/payments/family-subscription-member.entity";
import { coachProfilesRepository } from "../modules/coaches/coach-profiles.repository";
import {
  moduleEntitlementsService,
} from "../modules/admin/module-entitlements.service";
import type { ModuleKey } from "../modules/admin/module-catalog";

const ALLOWED_STATUSES = new Set(["active", "trialing"]);

async function subscriptionAccessForUser(userId: string): Promise<{
  allowed: boolean;
  status: string | null;
  reason: string | null;
}> {
  const subRepo = AppDataSource.getRepository(Subscription);
  const memberRepo = AppDataSource.getRepository(FamilySubscriptionMember);

  const owned = await subRepo.findOne({
    where: { userId },
    order: { createdAt: "DESC" },
  });
  if (owned && ALLOWED_STATUSES.has(owned.status)) {
    return { allowed: true, status: owned.status, reason: null };
  }

  const membership = await memberRepo.findOne({ where: { userId } });
  if (membership) {
    const family = await subRepo.findOne({ where: { id: membership.subscriptionId } });
    if (family && ALLOWED_STATUSES.has(family.status)) {
      return { allowed: true, status: family.status, reason: null };
    }
    if (family) {
      return {
        allowed: false,
        status: family.status,
        reason: `Family subscription is ${family.status}`,
      };
    }
  }

  if (owned) {
    return {
      allowed: false,
      status: owned.status,
      reason: `Subscription is ${owned.status}`,
    };
  }

  // Soft grace: users without any subscription row can still use tracking until they cancel a paid plan.
  if (!env.ENFORCE_SUBSCRIPTIONS) {
    return { allowed: true, status: null, reason: null };
  }

  return {
    allowed: false,
    status: null,
    reason: "An active subscription is required",
  };
}

export async function assertConsumerSubscription(userId: string) {
  const access = await subscriptionAccessForUser(userId);
  if (!access.allowed) {
    throw new ForbiddenError(access.reason ?? "Subscription required");
  }
  return access;
}

export async function assertCoachModule(coachUserId: string, moduleKey: ModuleKey) {
  if (!env.ENFORCE_ORG_MODULES) return;

  const profile = await coachProfilesRepository.findByUserId(coachUserId);
  const organizationKey = profile?.organization?.trim() || "default";
  const ok = await moduleEntitlementsService.hasModule(organizationKey, moduleKey);
  if (!ok) {
    throw new ForbiddenError(`Organization is not entitled to the ${moduleKey} module`);
  }
}
