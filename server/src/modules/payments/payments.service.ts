import { createHmac, timingSafeEqual } from "crypto";
import { randomUUID } from "crypto";
import { BadRequestError, ForbiddenError, NotFoundError } from "routing-controllers";
import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { Subscription } from "./subscription.entity";
import { PaymentTransaction } from "./payment-transaction.entity";
import type { CreateCheckoutDto, IremboWebhookDto } from "./payments.dto";
import { familySubscriptionService } from "./family.service";

const subscriptionsRepo = AppDataSource.getRepository(Subscription);
const transactionsRepo = AppDataSource.getRepository(PaymentTransaction);

export function verifyIremboWebhookSignature(rawBody: string, signatureHeader?: string): boolean {
  const secret = env.iremboPay.webhookSecret;
  if (!secret) {
    return env.NODE_ENV !== "production";
  }
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export const paymentsService = {
  async getMySubscription(userId: string) {
    const sub = await subscriptionsRepo.findOne({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    if (!sub) return null;
    return {
      id: sub.id,
      planCode: sub.planCode,
      subscriptionType: sub.subscriptionType,
      status: sub.status,
      renewsOn: sub.renewsOn,
      trialEndsOn: sub.trialEndsOn,
      organizationId: sub.organizationId,
    };
  },

  async createCheckout(userId: string, dto: CreateCheckoutDto) {
    if (dto.amount <= 0) throw new BadRequestError("amount must be greater than 0");

    let organizationId = dto.organizationId ?? null;
    if (dto.subscriptionType === "corporate" && dto.organizationName?.trim() && !organizationId) {
      const org = await familySubscriptionService.createOrganization(dto.organizationName.trim());
      organizationId = org.id;
    }

    if (dto.subscriptionType === "family") {
      const family = await familySubscriptionService.createFamilyPlan(userId, dto.planCode);
      return {
        externalRef: `FAMILY-${family.id.slice(0, 8).toUpperCase()}`,
        amount: dto.amount,
        currency: dto.currency ?? "RWF",
        checkoutUrl: "",
        status: family.status,
        subscriptionId: family.id,
        activated: true,
      };
    }

    let subscription = await subscriptionsRepo.findOne({ where: { userId }, order: { createdAt: "DESC" } });
    if (!subscription) {
      subscription = subscriptionsRepo.create({
        userId,
        organizationId: dto.subscriptionType === "corporate" ? organizationId : null,
        planCode: dto.planCode,
        subscriptionType: dto.subscriptionType ?? "individual",
        status: "trialing",
        metadata: {},
      });
      await subscriptionsRepo.save(subscription);
    } else {
      subscription.planCode = dto.planCode;
      if (dto.subscriptionType) subscription.subscriptionType = dto.subscriptionType;
      if (dto.organizationId) subscription.organizationId = dto.organizationId;
      if (organizationId) subscription.organizationId = organizationId;
      await subscriptionsRepo.save(subscription);
    }

    const externalRef = `IREMBO-${randomUUID().slice(0, 12).toUpperCase()}`;
    const tx = transactionsRepo.create({
      subscriptionId: subscription.id,
      provider: "irembopay",
      externalRef,
      currency: dto.currency ?? "RWF",
      amount: dto.amount.toFixed(2),
      status: "pending",
      payload: { planCode: dto.planCode, userId },
    });
    await transactionsRepo.save(tx);

    const checkoutUrl = env.iremboPay.apiKey
      ? `${env.iremboPay.checkoutBaseUrl}/${externalRef}?merchant=${env.iremboPay.merchantId}`
      : `${env.iremboPay.checkoutBaseUrl}/${externalRef}`;

    return {
      externalRef,
      amount: Number(tx.amount),
      currency: tx.currency,
      checkoutUrl,
      status: tx.status,
      subscriptionId: subscription.id,
    };
  },

  async handleWebhook(dto: IremboWebhookDto, rawBody?: string, signature?: string) {
    if (!verifyIremboWebhookSignature(rawBody ?? JSON.stringify(dto), signature)) {
      throw new ForbiddenError("Invalid webhook signature");
    }

    const tx = await transactionsRepo.findOne({ where: { externalRef: dto.externalRef } });
    if (!tx) throw new NotFoundError("Payment transaction not found");
    if (tx.status === dto.status) return { ok: true, duplicate: true };

    tx.status = dto.status;
    tx.processedAt = new Date();
    tx.payload = {
      ...(tx.payload ?? {}),
      webhook: dto.payload ?? {},
      updatedAt: new Date().toISOString(),
    };
    await transactionsRepo.save(tx);

    if (tx.subscriptionId) {
      const subscription = await subscriptionsRepo.findOne({ where: { id: tx.subscriptionId } });
      if (subscription) {
        if (dto.status === "succeeded") {
          subscription.status = "active";
          const next = new Date();
          next.setDate(next.getDate() + 30);
          subscription.renewsOn = next.toISOString().slice(0, 10);
        } else if (dto.status === "failed") {
          subscription.status = "past_due";
        } else if (dto.status === "cancelled") {
          subscription.status = "cancelled";
        }
        await subscriptionsRepo.save(subscription);
      }
    }
    return { ok: true };
  },

  async paymentSummary() {
    const rows = await transactionsRepo.find({ order: { createdAt: "DESC" }, take: 500 });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let totalRevenue = 0;
    let mtdRevenue = 0;
    let pendingPayments = 0;
    let failedPayments = 0;
    let succeededPayments = 0;

    for (const tx of rows) {
      const amount = Number(tx.amount) || 0;
      if (tx.status === "succeeded") {
        totalRevenue += amount;
        succeededPayments += 1;
        if (tx.processedAt && tx.processedAt >= monthStart) mtdRevenue += amount;
      } else if (tx.status === "pending") {
        pendingPayments += 1;
      } else if (tx.status === "failed") {
        failedPayments += 1;
      }
    }

    const subscriptions = await subscriptionsRepo.find({ order: { createdAt: "DESC" }, take: 200 });
    const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
    const byType = {
      individual: activeSubscriptions.filter((s) => s.subscriptionType === "individual").length,
      corporate: activeSubscriptions.filter((s) => s.subscriptionType === "corporate").length,
      family: activeSubscriptions.filter((s) => s.subscriptionType === "family").length,
    };

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      mtdRevenue: Math.round(mtdRevenue * 100) / 100,
      pendingPayments,
      failedPayments,
      succeededPayments,
      activeSubscriptions: activeSubscriptions.length,
      subscriptionsByType: byType,
      upcomingRenewals: activeSubscriptions
        .filter((s) => s.renewsOn)
        .slice(0, 20)
        .map((s) => ({
          id: s.id,
          planCode: s.planCode,
          subscriptionType: s.subscriptionType,
          renewsOn: s.renewsOn,
        })),
      recentPayments: rows.slice(0, 25).map((tx) => ({
        id: tx.id,
        externalRef: tx.externalRef,
        amount: Number(tx.amount),
        currency: tx.currency,
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
        processedAt: tx.processedAt?.toISOString() ?? null,
      })),
    };
  },
};
