import { createHmac, timingSafeEqual } from "crypto";

const WEBHOOK_SKEW_MS = 300_000;

/** Parse `irembopay-signature: t=<ms>,s=<hex>` and verify HMAC-SHA256(secret, `${t}#${rawBody}`). */
export function verifyIremboSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
  nowMs = Date.now(),
): boolean {
  if (!secret) return false;
  if (!signatureHeader?.trim()) return false;

  let timestamp: string | null = null;
  let signatureHash: string | null = null;
  for (const element of signatureHeader.split(",")) {
    const eq = element.indexOf("=");
    if (eq < 0) continue;
    const prefix = element.slice(0, eq).trim();
    const value = element.slice(eq + 1).trim();
    if (prefix === "t") timestamp = value;
    if (prefix === "s") signatureHash = value;
  }
  if (!timestamp || !signatureHash) return false;

  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(nowMs - timestampMs) > WEBHOOK_SKEW_MS) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}#${rawBody}`).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signatureHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type ParsedIremboWebhook = {
  transactionId: string | null;
  invoiceNumber: string | null;
  paymentStatus: string | null;
  amount: number | null;
  currency: string | null;
  raw: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Accept Irembo notification envelope or legacy stub `{ externalRef, status }`. */
export function parseIremboWebhookBody(body: unknown): ParsedIremboWebhook {
  const root = asRecord(body) ?? {};
  const data = asRecord(root.data) ?? root;

  const paymentStatus =
    (typeof data.paymentStatus === "string" && data.paymentStatus) ||
    (typeof root.paymentStatus === "string" && root.paymentStatus) ||
    null;

  const transactionId =
    (typeof data.transactionId === "string" && data.transactionId) ||
    (typeof root.transactionId === "string" && root.transactionId) ||
    (typeof root.externalRef === "string" && root.externalRef) ||
    null;

  const invoiceNumber =
    (typeof data.invoiceNumber === "string" && data.invoiceNumber) ||
    (typeof root.invoiceNumber === "string" && root.invoiceNumber) ||
    null;

  const amountRaw = data.amount ?? root.amount;
  const amount = amountRaw != null && Number.isFinite(Number(amountRaw)) ? Number(amountRaw) : null;
  const currency =
    (typeof data.currency === "string" && data.currency) ||
    (typeof root.currency === "string" && root.currency) ||
    null;

  if (!paymentStatus && typeof root.status === "string") {
    const legacy = root.status.toLowerCase();
    return {
      transactionId,
      invoiceNumber,
      paymentStatus:
        legacy === "succeeded"
          ? "PAID"
          : legacy === "failed"
            ? "FAILED"
            : legacy === "cancelled"
              ? "CANCELLED"
              : legacy.toUpperCase(),
      amount,
      currency,
      raw: root,
    };
  }

  return { transactionId, invoiceNumber, paymentStatus, amount, currency, raw: root };
}
