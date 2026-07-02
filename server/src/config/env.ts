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
    .map((o) => o.trim())
    .filter(Boolean);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3010),
  DATABASE_URL: required("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/mirafood"),
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6380",
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
  APP_URL: (process.env.APP_URL ?? process.env.WEB_APP_URL ?? "http://localhost:5173").replace(
    /\/$/,
    "",
  ),
  MOBILE_APP_SCHEME: process.env.MOBILE_APP_SCHEME ?? "mirafood",
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
  if (env.DATABASE_URL.includes("postgres:postgres@") || env.DATABASE_URL.includes("@localhost")) {
    throw new Error("DATABASE_URL must use production Docker credentials, not local defaults");
  }
}
