import { randomUUID } from "crypto";
import { BadRequestError, ForbiddenError, NotFoundError } from "routing-controllers";
import { AppDataSource } from "../../config/database";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { Subscription } from "./subscription.entity";
import { PaymentTransaction, type PaymentTransactionStatus } from "./payment-transaction.entity";
import type { CreateCheckoutDto } from "./payments.dto";
import { familySubscriptionService } from "./family.service";
import { getPlanByCode } from "./plan-catalog";
import { subscriptionPlansService } from "./subscription-plans.service";
import { adminAuditService } from "../admin/admin-audit.service";
import { usersRepository } from "../users/users.repository";
import {
  assertIremboConfiguredForCheckout,
  createIremboInvoice,
  getIremboInvoice,
  type IremboInvoice,
} from "./irembopay.client";
import {
  parseIremboWebhookBody,
  verifyIremboSignature,
  type ParsedIremboWebhook,
} from "./irembopay-webhook.util";
import { emailService } from "../../services/email.service";
import { buildPaymentReceiptPdf } from "../../services/payment-receipt.util";

const subscriptionsRepo = AppDataSource.getRepository(Subscription);
const transactionsRepo = AppDataSource.getRepository(PaymentTransaction);

export function verifyIremboWebhookSignature(rawBody: string, signatureHeader?: string): boolean {
  const secret = env.iremboPay.webhookSecret;
  if (!secret) {
    return env.NODE_ENV !== "production";
  }
  return verifyIremboSignature(rawBody, signatureHeader, secret);
}

export { parseIremboWebhookBody };

function mapPaymentStatusToTx(paymentStatus: string | null): PaymentTransactionStatus | null {
  if (!paymentStatus) return null;
  const s = paymentStatus.toUpperCase();
  if (s === "PAID") return "succeeded";
  if (s === "FAILED" || s === "EXPIRED") return "failed";
  if (s === "CANCELLED" || s === "CANCELED") return "cancelled";
  if (s === "NEW" || s === "PENDING") return "pending";
  return null;
}

async function findTransaction(parsed: ParsedIremboWebhook): Promise<PaymentTransaction | null> {
  if (parsed.transactionId) {
    const byRef = await transactionsRepo.findOne({ where: { externalRef: parsed.transactionId } });
    if (byRef) return byRef;
  }
  if (parsed.invoiceNumber) {
    const rows = await transactionsRepo.find({
      where: { provider: "irembopay" },
      order: { createdAt: "DESC" },
      take: 200,
    });
    return (
      rows.find((tx) => {
        const payload = tx.payload ?? {};
        return payload.invoiceNumber === parsed.invoiceNumber;
      }) ?? null
    );
  }
  return null;
}

async function activateSubscriptionFromTx(tx: PaymentTransaction) {
  if (!tx.subscriptionId) return;
  const subscription = await subscriptionsRepo.findOne({ where: { id: tx.subscriptionId } });
  if (!subscription) return;

  const payload = (tx.payload ?? {}) as Record<string, unknown>;
  const paidPlanCode =
    (typeof payload.planCode === "string" && payload.planCode) ||
    (typeof subscription.metadata?.pendingPlanCode === "string"
      ? subscription.metadata.pendingPlanCode
      : null) ||
    subscription.planCode;
  const paidPlan =
    (await subscriptionPlansService.getByCode(paidPlanCode)) ??
    (await subscriptionPlansService.getByCode(subscription.planCode)) ??
    getPlanByCode(paidPlanCode) ??
    getPlanByCode(subscription.planCode);
  subscription.planCode = paidPlan?.code ?? paidPlanCode;
  subscription.subscriptionType = paidPlan?.subscriptionType ?? subscription.subscriptionType;
  if (typeof payload.organizationId === "string" && payload.organizationId) {
    subscription.organizationId = payload.organizationId;
  }
  subscription.status = "active";
  const next = new Date();
  next.setDate(next.getDate() + (paidPlan?.intervalDays ?? 30));
  subscription.renewsOn = next.toISOString().slice(0, 10);
  if (subscription.metadata) {
    const { pendingPlanCode: _p, pendingSubscriptionType: _t, pendingOrganizationId: _o, ...rest } =
      subscription.metadata as Record<string, unknown>;
    subscription.metadata = rest;
  }
  await subscriptionsRepo.save(subscription);

  if (subscription.subscriptionType === "family" && subscription.userId) {
    await familySubscriptionService.ensurePayerMembership(subscription.id, subscription.userId);
  }
  if (subscription.userId) {
    await adminAuditService.log(subscription.userId, "subscription.activated", {
      targetType: "subscription",
      targetId: subscription.id,
      meta: { planCode: subscription.planCode, externalRef: tx.externalRef },
    });
  }

  await sendPaymentReceiptForTx(tx, subscription, paidPlan?.label ?? subscription.planCode);
}

async function sendPaymentReceiptForTx(
  tx: PaymentTransaction,
  subscription: Subscription,
  planLabel: string,
) {
  const payload = (tx.payload ?? {}) as Record<string, unknown>;
  if (payload.receiptEmailedAt) return;
  if (!subscription.userId) return;

  const user = await usersRepository.findById(subscription.userId);
  if (!user?.email) return;

  const receiptNumber =
    (typeof payload.receiptNumber === "string" && payload.receiptNumber) ||
    `MF-RCPT-${tx.externalRef.replace(/^MF-/, "").slice(0, 16)}`;
  const invoiceNumber =
    typeof payload.invoiceNumber === "string" ? payload.invoiceNumber : null;
  const amount = Number(tx.amount) || Number(payload.amount) || 0;
  const paidAt = tx.processedAt ?? new Date();

  try {
    const pdf = await buildPaymentReceiptPdf({
      receiptNumber,
      invoiceNumber,
      externalRef: tx.externalRef,
      customerName: user.displayName?.trim() || user.email.split("@")[0] || "Customer",
      customerEmail: user.email,
      planLabel,
      planCode: subscription.planCode,
      amount,
      currency: tx.currency || "RWF",
      paidAt,
      renewsOn: subscription.renewsOn,
      paymentMethod:
        typeof (payload.irembo as { paymentMethod?: string } | undefined)?.paymentMethod ===
        "string"
          ? (payload.irembo as { paymentMethod?: string }).paymentMethod
          : "IremboPay",
    });

    await emailService.sendPaymentReceiptEmail(user.email, {
      displayName: user.displayName,
      planLabel,
      amount,
      currency: tx.currency || "RWF",
      renewsOn: subscription.renewsOn,
      receiptNumber,
      invoiceNumber,
      pdfBuffer: pdf,
    });

    tx.payload = {
      ...payload,
      receiptNumber,
      receiptEmailedAt: new Date().toISOString(),
    };
    await transactionsRepo.save(tx);
  } catch (err) {
    logger.warn({ err, txId: tx.id }, "Failed to send payment receipt email");
  }
}

async function applyFailedOrCancelled(
  tx: PaymentTransaction,
  nextStatus: "failed" | "cancelled",
) {
  if (!tx.subscriptionId) return;
  const subscription = await subscriptionsRepo.findOne({ where: { id: tx.subscriptionId } });
  if (!subscription) return;

  if (nextStatus === "failed") {
    if (subscription.status !== "active") {
      subscription.status = "past_due";
      await subscriptionsRepo.save(subscription);
    }
  } else if (subscription.status !== "active") {
    subscription.status = "cancelled";
    await subscriptionsRepo.save(subscription);
  }

  if (subscription.metadata) {
    const { pendingPlanCode: _p, pendingSubscriptionType: _t, pendingOrganizationId: _o, ...rest } =
      subscription.metadata as Record<string, unknown>;
    subscription.metadata = rest;
    await subscriptionsRepo.save(subscription);
  }
}

async function syncFromInvoice(tx: PaymentTransaction, invoice: IremboInvoice) {
  const mapped = mapPaymentStatusToTx(invoice.paymentStatus);
  tx.payload = {
    ...(tx.payload ?? {}),
    invoiceNumber: invoice.invoiceNumber,
    irembo: invoice,
    syncedAt: new Date().toISOString(),
  };

  if (!mapped || mapped === "pending") {
    await transactionsRepo.save(tx);
    return { status: tx.status, invoice };
  }

  if (tx.status === mapped) {
    await transactionsRepo.save(tx);
    return { status: tx.status, invoice };
  }

  tx.status = mapped;
  tx.processedAt = new Date();
  await transactionsRepo.save(tx);

  if (mapped === "succeeded") {
    await activateSubscriptionFromTx(tx);
  } else if (mapped === "failed" || mapped === "cancelled") {
    await applyFailedOrCancelled(tx, mapped);
  }

  return { status: tx.status, invoice };
}

export const paymentsService = {
  listPlans() {
    return subscriptionPlansService.listPublic();
  },

  /**
   * Admin marks a user as paid through `renewsOn` (inclusive).
   * Does not create an Irembo charge — for manual / offline payments.
   */
  async grantSubscription(
    adminId: string,
    userId: string,
    input: { planCode?: string; renewsOn?: string; months?: number; note?: string },
  ) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const planCode = input.planCode?.trim() || "individual_monthly";
    const plan =
      (await subscriptionPlansService.getByCode(planCode)) ?? getPlanByCode(planCode);
    if (!plan) throw new BadRequestError("Unknown plan code");

    let renewsOn = input.renewsOn?.trim() || "";
    if (renewsOn) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(renewsOn)) {
        throw new BadRequestError("renewsOn must be YYYY-MM-DD");
      }
    } else {
      const months = Math.max(1, Math.round(input.months ?? 1));
      const end = new Date();
      end.setMonth(end.getMonth() + months);
      renewsOn = end.toISOString().slice(0, 10);
    }

    let subscription = await subscriptionsRepo.findOne({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    if (!subscription) {
      subscription = subscriptionsRepo.create({
        userId,
        planCode: plan.code,
        subscriptionType: plan.subscriptionType,
        status: "active",
        renewsOn,
        metadata: {
          grantedByAdminId: adminId,
          grantedAt: new Date().toISOString(),
          grantNote: input.note ?? null,
        },
      });
    } else {
      subscription.planCode = plan.code;
      subscription.subscriptionType = plan.subscriptionType;
      subscription.status = "active";
      subscription.renewsOn = renewsOn;
      subscription.metadata = {
        ...(subscription.metadata ?? {}),
        grantedByAdminId: adminId,
        grantedAt: new Date().toISOString(),
        grantNote: input.note ?? null,
      };
    }
    await subscriptionsRepo.save(subscription);

    if (subscription.subscriptionType === "family" && subscription.userId) {
      await familySubscriptionService.ensurePayerMembership(subscription.id, subscription.userId);
    }

    await adminAuditService.log(adminId, "subscription.granted", {
      targetType: "subscription",
      targetId: subscription.id,
      meta: {
        userId,
        planCode: subscription.planCode,
        renewsOn: subscription.renewsOn,
        note: input.note ?? null,
      },
    });

    const externalRef = `MF-MANUAL-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    const receiptNumber = `MF-RCPT-${externalRef.replace(/^MF-MANUAL-/, "").slice(0, 16)}`;
    const tx = transactionsRepo.create({
      subscriptionId: subscription.id,
      provider: "manual",
      externalRef,
      currency: plan.currency,
      amount: plan.amount.toFixed(2),
      status: "succeeded",
      processedAt: new Date(),
      payload: {
        planCode: plan.code,
        subscriptionType: plan.subscriptionType,
        userId,
        amount: plan.amount,
        receiptNumber,
        grantedByAdminId: adminId,
        grantNote: input.note ?? null,
        paymentMethod: "Admin grant",
      },
    });
    await transactionsRepo.save(tx);
    await sendPaymentReceiptForTx(tx, subscription, plan.label);

    return {
      id: subscription.id,
      planCode: subscription.planCode,
      subscriptionType: subscription.subscriptionType,
      status: subscription.status,
      renewsOn: subscription.renewsOn,
      trialEndsOn: subscription.trialEndsOn,
    };
  },

  async getMySubscription(userId: string) {
    const subs = await subscriptionsRepo.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    const sub =
      subs.find((row) => row.status === "active") ??
      subs.find((row) => row.status === "trialing") ??
      subs[0];
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

  async listMyPayments(userId: string) {
    const billing = await this.getUserBilling(userId);
    return {
      subscription: billing.subscription,
      payments: billing.payments.filter((p) => p.status === "succeeded"),
    };
  },

  async getReceiptPdfForUser(userId: string, paymentId: string): Promise<{
    filename: string;
    buffer: Buffer;
  }> {
    const tx = await transactionsRepo.findOne({ where: { id: paymentId } });
    if (!tx) throw new NotFoundError("Payment not found");
    const payload = (tx.payload ?? {}) as Record<string, unknown>;
    if (payload.userId && payload.userId !== userId) {
      throw new ForbiddenError("Payment does not belong to this user");
    }
    if (tx.subscriptionId) {
      const sub = await subscriptionsRepo.findOne({ where: { id: tx.subscriptionId } });
      if (!sub || sub.userId !== userId) {
        throw new ForbiddenError("Payment does not belong to this user");
      }
    } else if (payload.userId !== userId) {
      throw new ForbiddenError("Payment does not belong to this user");
    }

    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const planCode =
      (typeof payload.planCode === "string" && payload.planCode) ||
      "individual_monthly";
    const plan =
      (await subscriptionPlansService.getByCode(planCode)) ?? getPlanByCode(planCode);
    const receiptNumber =
      (typeof payload.receiptNumber === "string" && payload.receiptNumber) ||
      `MF-RCPT-${tx.externalRef.replace(/^MF-/, "").slice(0, 16)}`;
    const sub = tx.subscriptionId
      ? await subscriptionsRepo.findOne({ where: { id: tx.subscriptionId } })
      : null;

    const buffer = await buildPaymentReceiptPdf({
      receiptNumber,
      invoiceNumber:
        typeof payload.invoiceNumber === "string" ? payload.invoiceNumber : null,
      externalRef: tx.externalRef,
      customerName: user.displayName?.trim() || user.email.split("@")[0] || "Customer",
      customerEmail: user.email,
      planLabel: plan?.label ?? planCode,
      planCode,
      amount: Number(tx.amount) || 0,
      currency: tx.currency || "RWF",
      paidAt: tx.processedAt ?? tx.createdAt,
      renewsOn: sub?.renewsOn ?? null,
      paymentMethod:
        typeof payload.paymentMethod === "string"
          ? payload.paymentMethod
          : tx.provider === "manual"
            ? "Admin grant"
            : "IremboPay",
    });

    return { filename: `${receiptNumber}.pdf`, buffer };
  },

  /** Admin patient billing: current sub + payment history (Irembo + manual grants). */
  async getUserBilling(userId: string) {
    const subscriptions = await subscriptionsRepo.find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: 20,
    });
    const current = subscriptions[0] ?? null;
    const subscriptionIds = subscriptions.map((s) => s.id);

    let payments: PaymentTransaction[] = [];
    if (subscriptionIds.length) {
      payments = await transactionsRepo
        .createQueryBuilder("tx")
        .where("tx.subscriptionId IN (:...ids)", { ids: subscriptionIds })
        .orderBy("tx.createdAt", "DESC")
        .take(100)
        .getMany();
    }

    // Also pick up txs that only store userId in payload (edge cases).
    const payloadMatches = await transactionsRepo
      .createQueryBuilder("tx")
      .where("tx.payload->>'userId' = :userId", { userId })
      .orderBy("tx.createdAt", "DESC")
      .take(50)
      .getMany();

    const byId = new Map<string, PaymentTransaction>();
    for (const tx of [...payments, ...payloadMatches]) {
      byId.set(tx.id, tx);
    }
    const merged = Array.from(byId.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return {
      subscription: current
        ? {
            id: current.id,
            planCode: current.planCode,
            subscriptionType: current.subscriptionType,
            status: current.status,
            renewsOn: current.renewsOn,
            trialEndsOn: current.trialEndsOn,
            organizationId: current.organizationId,
            metadata: current.metadata ?? {},
            createdAt: current.createdAt.toISOString(),
            updatedAt: current.updatedAt.toISOString(),
          }
        : null,
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        planCode: s.planCode,
        subscriptionType: s.subscriptionType,
        status: s.status,
        renewsOn: s.renewsOn,
        createdAt: s.createdAt.toISOString(),
        grantedByAdmin: Boolean((s.metadata as Record<string, unknown> | undefined)?.grantedByAdminId),
        grantNote:
          typeof (s.metadata as Record<string, unknown> | undefined)?.grantNote === "string"
            ? ((s.metadata as Record<string, unknown>).grantNote as string)
            : null,
      })),
      payments: merged.map((tx) => {
        const payload = (tx.payload ?? {}) as Record<string, unknown>;
        return {
          id: tx.id,
          externalRef: tx.externalRef,
          invoiceNumber: typeof payload.invoiceNumber === "string" ? payload.invoiceNumber : null,
          planCode: typeof payload.planCode === "string" ? payload.planCode : null,
          amount: Number(tx.amount),
          currency: tx.currency,
          status: tx.status,
          provider: tx.provider,
          paymentLinkUrl:
            typeof payload.paymentLinkUrl === "string" ? payload.paymentLinkUrl : null,
          createdAt: tx.createdAt.toISOString(),
          processedAt: tx.processedAt?.toISOString() ?? null,
        };
      }),
    };
  },

  async createCheckout(userId: string, dto: CreateCheckoutDto) {
    assertIremboConfiguredForCheckout();

    const plan = await subscriptionPlansService.getByCode(dto.planCode);
    if (!plan) throw new BadRequestError("Unknown plan code");
    if (plan.public === false) {
      throw new BadRequestError("This plan is not available for self-serve checkout");
    }

    const serviceFeeCode = env.iremboPay.serviceFeeCode;

    let organizationId = dto.organizationId ?? null;
    if (plan.subscriptionType === "corporate" && dto.organizationName?.trim() && !organizationId) {
      const org = await familySubscriptionService.createOrganization(dto.organizationName.trim());
      organizationId = org.id;
    }

    let subscription = await subscriptionsRepo.findOne({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    if (!subscription) {
      // Pending checkout — no product access until webhook PAID → active.
      subscription = subscriptionsRepo.create({
        userId,
        organizationId: plan.subscriptionType === "corporate" ? organizationId : null,
        planCode: plan.code,
        subscriptionType: plan.subscriptionType,
        status: "past_due",
        metadata: { pendingPlanCode: plan.code },
      });
      await subscriptionsRepo.save(subscription);
    } else if (subscription.status === "cancelled" || subscription.status === "past_due") {
      subscription.planCode = plan.code;
      subscription.subscriptionType = plan.subscriptionType;
      if (organizationId) subscription.organizationId = organizationId;
      subscription.status = "past_due";
      subscription.metadata = {
        ...(subscription.metadata ?? {}),
        pendingPlanCode: plan.code,
      };
      await subscriptionsRepo.save(subscription);
    } else {
      // Keep current access (e.g. active) while a plan change payment is pending.
      subscription.metadata = {
        ...(subscription.metadata ?? {}),
        pendingPlanCode: plan.code,
        pendingSubscriptionType: plan.subscriptionType,
        pendingOrganizationId: organizationId,
      };
      await subscriptionsRepo.save(subscription);
    }

    const user = await usersRepository.findById(userId);
    const transactionId = `MF-${randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`;
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    const invoice = await createIremboInvoice({
      transactionId,
      paymentAccountIdentifier: env.iremboPay.payoutAccount,
      paymentItems: [
        {
          code: serviceFeeCode,
          quantity: 1,
          unitAmount: plan.amount,
        },
      ],
      description: `MiraFood ${plan.label} subscription`,
      language: "EN",
      expiryAt: expiry.toISOString(),
      customer: {
        email: user?.email,
        phoneNumber: user?.phone ?? undefined,
        name: user?.email?.split("@")[0],
      },
    });

    if (!invoice.paymentLinkUrl) {
      logger.error({ invoice }, "IremboPay invoice missing paymentLinkUrl");
      throw new BadRequestError("Payment link was not returned by IremboPay");
    }

    const tx = transactionsRepo.create({
      subscriptionId: subscription.id,
      provider: "irembopay",
      externalRef: transactionId,
      currency: plan.currency,
      amount: plan.amount.toFixed(2),
      status: "pending",
      payload: {
        planCode: plan.code,
        subscriptionType: plan.subscriptionType,
        organizationId,
        userId,
        amount: plan.amount,
        productCode: serviceFeeCode,
        invoiceNumber: invoice.invoiceNumber,
        paymentLinkUrl: invoice.paymentLinkUrl,
        irembo: invoice,
      },
    });
    await transactionsRepo.save(tx);

    await adminAuditService.log(userId, "subscription.checkout_created", {
      targetType: "subscription",
      targetId: subscription.id,
      meta: {
        planCode: plan.code,
        externalRef: transactionId,
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    return {
      externalRef: transactionId,
      invoiceNumber: invoice.invoiceNumber,
      amount: plan.amount,
      currency: plan.currency,
      checkoutUrl: invoice.paymentLinkUrl,
      status: tx.status,
      subscriptionId: subscription.id,
      planCode: plan.code,
      subscriptionType: plan.subscriptionType,
      activated: false,
    };
  },

  async getCheckoutStatus(userId: string, externalRef: string) {
    const tx = await transactionsRepo.findOne({ where: { externalRef } });
    if (!tx) throw new NotFoundError("Checkout not found");

    const payload = (tx.payload ?? {}) as Record<string, unknown>;
    if (payload.userId && payload.userId !== userId) {
      throw new ForbiddenError("Checkout does not belong to this user");
    }

    // Reconcile with Irembo when still pending
    if (tx.status === "pending" && env.iremboPay.secretKey) {
      try {
        const invoice = await getIremboInvoice(externalRef);
        await syncFromInvoice(tx, invoice);
      } catch (err) {
        logger.warn({ err, externalRef }, "IremboPay getInvoice reconcile failed");
      }
    }

    const refreshed = await transactionsRepo.findOne({ where: { id: tx.id } });
    const sub =
      refreshed?.subscriptionId != null
        ? await subscriptionsRepo.findOne({ where: { id: refreshed.subscriptionId } })
        : null;

    return {
      externalRef,
      invoiceNumber: (refreshed?.payload?.invoiceNumber as string | undefined) ?? null,
      status: refreshed?.status ?? tx.status,
      amount: Number(refreshed?.amount ?? tx.amount),
      currency: refreshed?.currency ?? tx.currency,
      checkoutUrl: (refreshed?.payload?.paymentLinkUrl as string | undefined) ?? null,
      subscription: sub
        ? {
            id: sub.id,
            planCode: sub.planCode,
            status: sub.status,
            renewsOn: sub.renewsOn,
          }
        : null,
    };
  },

  async handleWebhook(body: unknown, rawBody?: string, signature?: string) {
    const raw = rawBody ?? JSON.stringify(body ?? {});
    if (!verifyIremboWebhookSignature(raw, signature)) {
      throw new ForbiddenError("Invalid webhook signature");
    }

    const parsed = parseIremboWebhookBody(body);
    const tx = await findTransaction(parsed);
    if (!tx) throw new NotFoundError("Payment transaction not found");

    const mapped = mapPaymentStatusToTx(parsed.paymentStatus);
    if (!mapped) {
      logger.info({ parsed }, "IremboPay webhook ignored (unmapped status)");
      return { ok: true, ignored: true };
    }

    if (tx.status === mapped) {
      return { ok: true, duplicate: true };
    }

    tx.status = mapped;
    tx.processedAt = new Date();
    tx.payload = {
      ...(tx.payload ?? {}),
      invoiceNumber: parsed.invoiceNumber ?? tx.payload?.invoiceNumber,
      webhook: parsed.raw,
      updatedAt: new Date().toISOString(),
    };
    await transactionsRepo.save(tx);

    if (mapped === "succeeded") {
      await activateSubscriptionFromTx(tx);
    } else if (mapped === "failed" || mapped === "cancelled") {
      await applyFailedOrCancelled(tx, mapped);
    }

    return { ok: true };
  },

  async paymentSummary() {
    const rows = await transactionsRepo.find({ order: { createdAt: "DESC" }, take: 2000 });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const seriesStart = new Date(todayStart);
    seriesStart.setDate(seriesStart.getDate() - 13);

    let totalRevenue = 0;
    let mtdRevenue = 0;
    let todayRevenue = 0;
    let pendingPayments = 0;
    let failedPayments = 0;
    let succeededPayments = 0;
    let cancelledPayments = 0;
    const dailyMap = new Map<string, number>();
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(seriesStart);
      d.setDate(seriesStart.getDate() + i);
      dailyMap.set(d.toISOString().slice(0, 10), 0);
    }

    for (const tx of rows) {
      const amount = Number(tx.amount) || 0;
      if (tx.status === "succeeded") {
        totalRevenue += amount;
        succeededPayments += 1;
        const when = tx.processedAt ?? tx.createdAt;
        if (when >= monthStart) mtdRevenue += amount;
        if (when >= todayStart) todayRevenue += amount;
        const dayKey = when.toISOString().slice(0, 10);
        if (dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + amount);
        }
      } else if (tx.status === "pending") {
        pendingPayments += 1;
      } else if (tx.status === "failed") {
        failedPayments += 1;
      } else if (tx.status === "cancelled") {
        cancelledPayments += 1;
      }
    }

    const decided = succeededPayments + failedPayments;
    const failureRate = decided > 0 ? Math.round((failedPayments / decided) * 1000) / 10 : 0;

    const subscriptions = await subscriptionsRepo.find({ order: { createdAt: "DESC" }, take: 500 });
    const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
    const byType = {
      individual: activeSubscriptions.filter((s) => s.subscriptionType === "individual").length,
      corporate: activeSubscriptions.filter((s) => s.subscriptionType === "corporate").length,
      family: activeSubscriptions.filter((s) => s.subscriptionType === "family").length,
    };
    const byPlan = {
      individual_weekly: activeSubscriptions.filter((s) => s.planCode === "individual_weekly").length,
      individual_monthly: activeSubscriptions.filter((s) => s.planCode === "individual_monthly")
        .length,
      family_monthly: activeSubscriptions.filter((s) => s.planCode === "family_monthly").length,
      corporate_monthly: activeSubscriptions.filter((s) => s.planCode === "corporate_monthly")
        .length,
    };

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      mtdRevenue: Math.round(mtdRevenue * 100) / 100,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      pendingPayments,
      failedPayments,
      succeededPayments,
      cancelledPayments,
      failureRate,
      activeSubscriptions: activeSubscriptions.length,
      subscriptionsByType: byType,
      subscriptionsByPlan: byPlan,
      dailyRevenue: Array.from(dailyMap.entries()).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100,
      })),
      upcomingRenewals: activeSubscriptions
        .filter((s) => s.renewsOn)
        .sort((a, b) => String(a.renewsOn).localeCompare(String(b.renewsOn)))
        .slice(0, 20)
        .map((s) => ({
          id: s.id,
          planCode: s.planCode,
          subscriptionType: s.subscriptionType,
          renewsOn: s.renewsOn,
        })),
      recentPayments: rows.slice(0, 40).map((tx) => ({
        id: tx.id,
        externalRef: tx.externalRef,
        invoiceNumber: (tx.payload?.invoiceNumber as string | undefined) ?? null,
        planCode: (tx.payload?.planCode as string | undefined) ?? null,
        amount: Number(tx.amount),
        currency: tx.currency,
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
        processedAt: tx.processedAt?.toISOString() ?? null,
      })),
    };
  },
};
