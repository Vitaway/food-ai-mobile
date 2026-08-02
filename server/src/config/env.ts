import "reflect-metadata";
import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/** Prefer POSTGRES_PASSWORD — URL-encoded; host defaults to Docker service or localhost dev ports. */
function buildDatabaseUrl(): string {
  const password = process.env.POSTGRES_PASSWORD;
  if (password) {
    const user = process.env.POSTGRES_USER ?? "postgres";
    const dockerProd = process.env.NODE_ENV === "production";
    const host = process.env.POSTGRES_HOST ?? (dockerProd ? "postgres" : "127.0.0.1");
    const port = process.env.POSTGRES_PORT ?? (dockerProd ? "5432" : "5433");
    const db = process.env.POSTGRES_DB ?? "mirafood";
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
  }
  return required("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:5433/mirafood");
}

/** Prefer REDIS_PASSWORD — URL-encoded; host defaults to Docker service or localhost dev ports. */
function buildRedisUrl(): string {
  const password = process.env.REDIS_PASSWORD;
  if (password) {
    const dockerProd = process.env.NODE_ENV === "production";
    const host = process.env.REDIS_HOST ?? (dockerProd ? "redis" : "127.0.0.1");
    const port = process.env.REDIS_PORT ?? (dockerProd ? "6379" : "6380");
    return `redis://:${encodeURIComponent(password)}@${host}:${port}`;
  }
  return process.env.REDIS_URL ?? "redis://127.0.0.1:6380";
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3010),
  DATABASE_URL: buildDatabaseUrl(),
  REDIS_URL: buildRedisUrl(),
  JWT_SECRET: required("JWT_SECRET", "dev-secret-change-me"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  CORS_ORIGIN: parseOrigins(
    process.env.CORS_ORIGIN ??
      "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081,http://127.0.0.1:8081",
  ),
  /** Anthropic Claude API — used for plate detection + meal analysis. */
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
  ANTHROPIC_TEMPERATURE: Number(process.env.ANTHROPIC_TEMPERATURE ?? 0.05),
  PLATE_GEOMETRY_DISTANCE_WEIGHT: Number(process.env.PLATE_GEOMETRY_DISTANCE_WEIGHT ?? 0.72),
  AUTO_RUN_MIGRATIONS: process.env.AUTO_RUN_MIGRATIONS !== "false",
  TYPEORM_QUERY_LOG: process.env.TYPEORM_QUERY_LOG === "true",
  /**
   * When true, consumers need an active subscription for product APIs.
   * Defaults on in production; set ENFORCE_SUBSCRIPTIONS=false for emergency bypass.
   */
  ENFORCE_SUBSCRIPTIONS:
    process.env.ENFORCE_SUBSCRIPTIONS === "true" ||
    (process.env.ENFORCE_SUBSCRIPTIONS !== "false" &&
      (process.env.NODE_ENV ?? "development") === "production"),
  /** When true, coach clinical/coaching routes require org module entitlements. */
  ENFORCE_ORG_MODULES: process.env.ENFORCE_ORG_MODULES === "true",
  /** Require email OTP after password for coach/admin roles. Defaults on in production. */
  MFA_REQUIRED_FOR_STAFF:
    process.env.MFA_REQUIRED_FOR_STAFF === "true" ||
    (process.env.MFA_REQUIRED_FOR_STAFF !== "false" && process.env.NODE_ENV === "production"),
  ENABLE_LEGACY_PLATES_DETECT: process.env.ENABLE_LEGACY_PLATES_DETECT === "true",
  EXPO_ACCESS_TOKEN: process.env.EXPO_ACCESS_TOKEN ?? "",
  SEED_COACH_EMAIL: process.env.SEED_COACH_EMAIL ?? "coach@vitaway.org",
  SEED_COACH_PASSWORD: process.env.SEED_COACH_PASSWORD ?? "Test@123",
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL ?? "admin@vitaway.org",
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? "Test@123",
  SEED_CONSUMER_EMAIL: process.env.SEED_CONSUMER_EMAIL ?? "patient@vitaway.org",
  SEED_CONSUMER_PASSWORD: process.env.SEED_CONSUMER_PASSWORD ?? "Test@123",
  SEED_NUTRITION_COACH_EMAIL:
    process.env.SEED_NUTRITION_COACH_EMAIL ?? "nutrition@vitaway.org",
  SEED_NUTRITION_COACH_PASSWORD: process.env.SEED_NUTRITION_COACH_PASSWORD ?? "Test@123",
  SEED_ORG_ADMIN_EMAIL: process.env.SEED_ORG_ADMIN_EMAIL ?? "orgadmin@vitaway.org",
  SEED_ORG_ADMIN_PASSWORD: process.env.SEED_ORG_ADMIN_PASSWORD ?? "Test@123",
  SEED_DATA_ENTRY_EMAIL: process.env.SEED_DATA_ENTRY_EMAIL ?? "dataentry@vitaway.org",
  SEED_DATA_ENTRY_PASSWORD: process.env.SEED_DATA_ENTRY_PASSWORD ?? "Test@123",
  APP_URL: (process.env.APP_URL ?? process.env.WEB_APP_URL ?? "http://localhost:5173").replace(
    /\/$/,
    "",
  ),
  MOBILE_APP_SCHEME: process.env.MOBILE_APP_SCHEME ?? "mirafood",
  iremboPay: (() => {
    const isProd = (process.env.NODE_ENV ?? "development") === "production";
    const secretKey =
      process.env.IREMBO_PAY_SECRET_KEY?.trim() ||
      process.env.IREMBOPAY_SECRET_KEY?.trim() ||
      process.env.IREMBOPAY_API_KEY?.trim() ||
      "";
    const publicKey =
      process.env.IREMBO_PAY_PUBLIC_KEY?.trim() ||
      process.env.IREMBOPAY_PUBLIC_KEY?.trim() ||
      "";
    /** Prefer IREMBO_PAY_BASE_URL (…/payments). Legacy IREMBOPAY_API_URL was host-only. */
    const rawBase =
      process.env.IREMBO_PAY_BASE_URL?.trim() ||
      process.env.IREMBOPAY_API_URL?.trim() ||
      (isProd ? "https://api.irembopay.com/payments" : "https://api.sandbox.irembopay.com/payments");
    let baseUrl = rawBase.replace(/\/$/, "");
    // If legacy host-only URL, append /payments so paths are /invoices not /payments/invoices twice.
    if (!/\/payments$/i.test(baseUrl)) {
      baseUrl = `${baseUrl}/payments`;
    }
    const payoutAccount =
      process.env.IREMBO_PAYOUT_ACCOUNT?.trim() ||
      process.env.IREMBOPAY_PAYMENT_ACCOUNT?.trim() ||
      "";
    const serviceFeeCode =
      process.env.IREMBO_SERVICE_FEE_CODE?.trim() ||
      process.env.IREMBOPAY_PRODUCT_MONTHLY?.trim() ||
      "";
    const shippingProductCode =
      process.env.IREMBO_SHIPPING_PRODUCT_CODE?.trim() || "";
    const widgetUrl =
      process.env.IREMBO_PAY_WIDGET?.trim() ||
      "https://dashboard.irembopay.com/assets/payment/inline.js";
    return {
      /** e.g. https://api.irembopay.com/payments — client calls {baseUrl}/invoices */
      baseUrl,
      secretKey,
      publicKey,
      webhookSecret: secretKey,
      payoutAccount,
      serviceFeeCode,
      shippingProductCode,
      widgetUrl,
      /** @deprecated use baseUrl */
      apiUrl: baseUrl,
      /** @deprecated use payoutAccount */
      paymentAccountIdentifier: payoutAccount,
      /** @deprecated use secretKey */
      apiKey: secretKey,
    };
  })(),
  email: {
    service: process.env.SMTP_SERVICE ?? "",
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.EMAIL_FROM ?? "MiraFood <noreply@vitaway.org>",
  },
} as const;

/** Seed/demo logins that skip staff email OTP (coach@ / admin@ etc.). */
export function isSeedLoginEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const seedEmails = [
    env.SEED_COACH_EMAIL,
    env.SEED_ADMIN_EMAIL,
    env.SEED_NUTRITION_COACH_EMAIL,
    env.SEED_ORG_ADMIN_EMAIL,
    env.SEED_DATA_ENTRY_EMAIL,
  ].map((e) => e.toLowerCase().trim());
  return seedEmails.includes(normalized);
}

export const isProduction = env.NODE_ENV === "production";

const WEAK_SECRETS = new Set([
  "dev-secret-change-me",
  "change-me-in-production",
  "postgres",
  "password",
  "changeme",
]);

if (isProduction) {
  if (env.JWT_SECRET.length < 32 || WEAK_SECRETS.has(env.JWT_SECRET)) {
    throw new Error("JWT_SECRET must be a random string of at least 32 characters in production");
  }
  if (!process.env.POSTGRES_PASSWORD) {
    throw new Error("POSTGRES_PASSWORD must be set in production");
  }
  if (!process.env.REDIS_PASSWORD) {
    throw new Error("REDIS_PASSWORD must be set in production");
  }
}
