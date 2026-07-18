import { createHash, randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { IsNull, LessThan, MoreThan } from "typeorm";
import { AppDataSource } from "../../config/database";
import { PasswordResetOtp } from "./password-reset-otp.entity";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const otpRepo = () => AppDataSource.getRepository(PasswordResetOtp);

/** 6-digit numeric code, never all zeros. */
export function generateOtpCode(): string {
  return String(randomInt(100_000, 1_000_000));
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtpCode(code: string, codeHash: string): Promise<boolean> {
  return bcrypt.compare(code, codeHash);
}

/** Fingerprint for logging without exposing the code. */
export function otpFingerprint(code: string): string {
  return createHash("sha256").update(code).digest("hex").slice(0, 12);
}

export async function invalidateOpenOtps(userId: string): Promise<void> {
  await otpRepo().update({ userId, consumedAt: IsNull() }, { consumedAt: new Date() });
}

export async function createPasswordResetOtp(opts: {
  userId: string;
  email: string;
  code: string;
}): Promise<PasswordResetOtp> {
  await invalidateOpenOtps(opts.userId);
  const row = otpRepo().create({
    userId: opts.userId,
    email: opts.email,
    codeHash: await hashOtpCode(opts.code),
    attempts: 0,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    consumedAt: null,
  });
  return otpRepo().save(row);
}

export async function findLatestOpenOtp(email: string): Promise<PasswordResetOtp | null> {
  return otpRepo().findOne({
    where: {
      email: email.toLowerCase().trim(),
      consumedAt: IsNull(),
      expiresAt: MoreThan(new Date()),
    },
    order: { createdAt: "DESC" },
  });
}

export async function recentlyIssuedOtp(userId: string): Promise<PasswordResetOtp | null> {
  const since = new Date(Date.now() - OTP_RESEND_COOLDOWN_MS);
  return otpRepo().findOne({
    where: {
      userId,
      createdAt: MoreThan(since),
    },
    order: { createdAt: "DESC" },
  });
}

export async function markOtpConsumed(otp: PasswordResetOtp): Promise<void> {
  otp.consumedAt = new Date();
  await otpRepo().save(otp);
}

export async function incrementOtpAttempts(otp: PasswordResetOtp): Promise<void> {
  otp.attempts += 1;
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    otp.consumedAt = new Date();
  }
  await otpRepo().save(otp);
}

export async function purgeExpiredOtps(): Promise<void> {
  await otpRepo().delete({ expiresAt: LessThan(new Date()) });
}
