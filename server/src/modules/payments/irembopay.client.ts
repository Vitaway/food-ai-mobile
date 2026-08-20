import { BadRequestError, HttpError } from "routing-controllers";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

export type IremboPaymentItem = {
  code: string;
  quantity: number;
  unitAmount: number;
};

export type IremboCustomer = {
  email?: string;
  phoneNumber?: string;
  name?: string;
};

export type IremboInvoice = {
  invoiceNumber: string;
  transactionId: string;
  paymentAccountIdentifier: string;
  paymentStatus: string;
  amount: number;
  currency: string;
  type?: string;
  paymentLinkUrl: string;
  description?: string;
  expiryAt?: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentItems?: IremboPaymentItem[];
  customer?: IremboCustomer;
  createdAt?: string;
  updatedAt?: string;
};

type IremboApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ code?: string; detail?: string }>;
};

function iremboHeaders(): Record<string, string> {
  const secret = env.iremboPay.secretKey;
  if (!secret) {
    throw new BadRequestError("IremboPay is not configured (missing IREMBO_PAY_SECRET_KEY)");
  }
  return {
    "Content-Type": "application/json",
    "irembopay-secretKey": secret,
    "X-API-Version": "2",
  };
}

async function iremboRequest<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const base = env.iremboPay.baseUrl.replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: iremboHeaders(),
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    logger.error({ err, url }, "IremboPay network error");
    throw new HttpError(502, "Unable to reach IremboPay");
  }

  const json = (await response.json().catch(() => ({}))) as IremboApiEnvelope<T>;
  if (!response.ok || json.success === false) {
    const detail =
      json.errors?.map((e) => e.detail ?? e.code).filter(Boolean).join("; ") ||
      json.message ||
      `IremboPay error (${response.status})`;
    logger.warn({ status: response.status, detail, path }, "IremboPay API error");
    throw new BadRequestError(detail);
  }
  if (json.data == null) {
    throw new HttpError(502, "IremboPay returned an empty response");
  }
  return json.data;
}

export type CreateIremboInvoiceInput = {
  transactionId: string;
  paymentItems: IremboPaymentItem[];
  paymentAccountIdentifier: string;
  description?: string;
  language?: "EN" | "FR" | "RW";
  customer?: IremboCustomer;
  expiryAt?: string;
};

/** Create invoice; BASE_URL already includes /payments, so path is /invoices. */
export async function createIremboInvoice(input: CreateIremboInvoiceInput): Promise<IremboInvoice> {
  return iremboRequest<IremboInvoice>("POST", "/invoices", {
    transactionId: input.transactionId,
    paymentItems: input.paymentItems,
    paymentAccountIdentifier: input.paymentAccountIdentifier,
    description: input.description,
    language: input.language ?? "EN",
    customer: input.customer,
    expiryAt: input.expiryAt,
  });
}

/** Fetch invoice by invoice number or merchant transactionId. */
export async function getIremboInvoice(invoiceReference: string): Promise<IremboInvoice> {
  const encoded = encodeURIComponent(invoiceReference);
  return iremboRequest<IremboInvoice>("GET", `/invoices/${encoded}`);
}

export function assertIremboConfiguredForCheckout(): void {
  const { secretKey, payoutAccount, serviceFeeCode } = env.iremboPay;
  if (!secretKey || !payoutAccount || !serviceFeeCode) {
    if (env.NODE_ENV === "production") {
      throw new BadRequestError("Payment provider is not configured");
    }
    throw new BadRequestError(
      "IremboPay is not configured. Set IREMBO_PAY_SECRET_KEY, IREMBO_PAYOUT_ACCOUNT, and IREMBO_SERVICE_FEE_CODE.",
    );
  }
}
