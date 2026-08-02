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

/** Product access requires a paid active subscription (trialing does not grant access). */
const ALLOWED_STATUSES = new Set(["active"]);

export const SUBSCRIPTION_REQUIRED_MESSAGE = "An active subscription is required";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Active and not past renewsOn (inclusive end date). */
export function subscriptionGrantsAccess(sub: Pick<Subscription, "status" | "renewsOn">): boolean {
  if (!ALLOWED_STATUSES.has(sub.status)) return false;
  if (!sub.renewsOn) return true;
  return sub.renewsOn >= todayKey();
}

export async function getConsumerSubscriptionAccess(userId: string): Promise<{
  allowed: boolean;
  status: string | null;
  renewsOn: string | null;
  reason: string | null;
}> {
  const subRepo = AppDataSource.getRepository(Subscription);
  const memberRepo = AppDataSource.getRepository(FamilySubscriptionMember);

  const ownedSubs = await subRepo.find({
    where: { userId },
    order: { createdAt: "DESC" },
  });
  const grantingOwned = ownedSubs.find((sub) => subscriptionGrantsAccess(sub));
  if (grantingOwned) {
    return {
      allowed: true,
      status: grantingOwned.status,
      renewsOn: grantingOwned.renewsOn,
      reason: null,
    };
  }
  const owned = ownedSubs[0] ?? null;

  const membership = await memberRepo.findOne({ where: { userId } });
  if (membership) {
    const family = await subRepo.findOne({ where: { id: membership.subscriptionId } });
    if (family && subscriptionGrantsAccess(family)) {
      return { allowed: true, status: family.status, renewsOn: family.renewsOn, reason: null };
    }
    if (family) {
      const expired = family.status === "active" && family.renewsOn && family.renewsOn < todayKey();
      return {
        allowed: false,
        status: family.status,
        renewsOn: family.renewsOn,
        reason: expired
          ? "Family subscription has expired"
          : `Family subscription is ${family.status}`,
      };
    }
  }

  if (owned) {
    const expired = owned.status === "active" && owned.renewsOn && owned.renewsOn < todayKey();
    return {
      allowed: false,
      status: owned.status,
      renewsOn: owned.renewsOn,
      reason: expired ? "Subscription has expired" : `Subscription is ${owned.status}`,
    };
  }

  // Soft grace only when enforcement is off (non-prod / emergency bypass).
  if (!env.ENFORCE_SUBSCRIPTIONS) {
    return { allowed: true, status: null, renewsOn: null, reason: null };
  }

  return {
    allowed: false,
    status: null,
    renewsOn: null,
    reason: SUBSCRIPTION_REQUIRED_MESSAGE,
  };
}

export async function assertConsumerSubscription(userId: string) {
  const access = await getConsumerSubscriptionAccess(userId);
  if (!access.allowed) {
    throw new ForbiddenError(access.reason ?? SUBSCRIPTION_REQUIRED_MESSAGE);
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
