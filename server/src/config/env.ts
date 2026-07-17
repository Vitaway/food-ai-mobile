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
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
  OPENROUTER_APP_NAME: process.env.OPENROUTER_APP_NAME ?? "MiraFood",
  OPENROUTER_SITE_URL: process.env.OPENROUTER_SITE_URL ?? "https://mirafood.vitaway.org",
  OPENROUTER_IMAGE_DETAIL: (process.env.OPENROUTER_IMAGE_DETAIL ?? "high") as "low" | "high" | "auto",
  OPENROUTER_TEMPERATURE: Number(process.env.OPENROUTER_TEMPERATURE ?? 0.05),
  PLATE_GEOMETRY_DISTANCE_WEIGHT: Number(process.env.PLATE_GEOMETRY_DISTANCE_WEIGHT ?? 0.72),
  AUTO_RUN_MIGRATIONS: process.env.AUTO_RUN_MIGRATIONS !== "false",
  TYPEORM_QUERY_LOG: process.env.TYPEORM_QUERY_LOG === "true",
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
  iremboPay: {
    apiUrl: (process.env.IREMBOPAY_API_URL ?? "https://api.irembopay.com").replace(/\/$/, ""),
    checkoutBaseUrl: (process.env.IREMBOPAY_CHECKOUT_URL ?? "https://pay.irembopay.com/checkout").replace(
      /\/$/,
      "",
    ),
    apiKey: process.env.IREMBOPAY_API_KEY ?? "",
    webhookSecret: process.env.IREMBOPAY_WEBHOOK_SECRET ?? "",
    merchantId: process.env.IREMBOPAY_MERCHANT_ID ?? "",
  },
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
