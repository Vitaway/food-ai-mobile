import bcrypt from "bcryptjs";
import type { Request } from "express";
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from "routing-controllers";
import { signAuthToken } from "../../middlewares/auth.middleware";
import jwt from "jsonwebtoken";
import { usersRepository } from "../users/users.repository";
import { authRepository } from "./auth.repository";
import type {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
  VerifyMfaDto,
} from "./auth.dto";
import {
  createPasswordResetOtp,
  findLatestOpenOtp,
  generateOtpCode,
  incrementOtpAttempts,
  invalidateOpenOtps,
  markOtpConsumed,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  otpFingerprint,
  purgeExpiredOtps,
  recentlyIssuedOtp,
  verifyOtpCode,
} from "./password-reset-otp.util";
import type { PasswordResetOtp } from "./password-reset-otp.entity";
import { env, isSeedLoginEmail } from "../../config/env";
import { coachProfilesRepository } from "../coaches/coach-profiles.repository";
import { consumerProfilesRepository } from "../consumers/consumer-profiles.repository";
import { resolveOnboardingComplete } from "../consumers/onboarding.util";
import { ensureConsumerProfileForUser } from "../consumers/ensure-consumer-profile.util";
import { generatePatientId } from "../../utils/patient-id";
import { logger } from "../../config/logger";
import { emailService } from "../../services/email.service";
import { generateReferralCode } from "../../utils/referral-code";
import { notificationsService } from "../notifications/notifications.service";
import { adminAuditService } from "../admin/admin-audit.service";

export interface AuthUserDto {
  id: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  patientId?: string;
  organizationId?: string | null;
}
 
export interface LoginResult {
  token: string;
  user: AuthUserDto;
  coachProfile?: {
    id: string;
    title: string | null;
    organization: string | null;
  };
  consumerProfile?: {
    patientId: string;
    onboardingComplete: boolean;
  };
}

export type MfaChallengeResult = {
  mfaRequired: true;
  challengeToken: string;
  email: string;
  /** Present only outside production when email delivery may be unavailable. */
  debugCode?: string;
};

function isStaffRole(role: string) {
  return role !== "consumer";
}

function signMfaChallengeToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: "mfa" }, env.JWT_SECRET, { expiresIn: "10m" });
}

function verifyMfaChallengeToken(token: string): { sub: string } {
  const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string; purpose?: string };
  if (!payload.sub || payload.purpose !== "mfa") {
    throw new UnauthorizedError("Invalid or expired verification challenge");
  }
  return { sub: payload.sub };
}

function toAuthUser(
  user: {
    id: string;
    email: string;
    role: string;
    displayName: string;
    avatarUrl: string | null;
    organizationId?: string | null;
  },
  patientId?: string,
): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    organizationId: user.organizationId ?? null,
    ...(patientId ? { patientId } : {}),
  };
}

async function createSession(userId: string, req?: Request) {
  const session = authRepository.create({
    userId,
    userAgent: req?.headers["user-agent"] ?? null,
    ip: req?.ip ?? null,
    revokedAt: null,
  });
  await authRepository.save(session);
  return session;
}

async function assertValidResetOtp(emailRaw: string, codeRaw: string): Promise<PasswordResetOtp> {
  const email = emailRaw.toLowerCase().trim();
  const code = codeRaw.trim();
  const otp = await findLatestOpenOtp(email);

  if (!otp) {
    throw new BadRequestError("Invalid or expired code. Request a new one.");
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw new BadRequestError("Too many incorrect attempts. Request a new code.");
  }

  const matches = await verifyOtpCode(code, otp.codeHash);
  if (!matches) {
    await incrementOtpAttempts(otp);
    const remaining = OTP_MAX_ATTEMPTS - otp.attempts;
    if (remaining <= 0) {
      throw new BadRequestError("Too many incorrect attempts. Request a new code.");
    }
    throw new BadRequestError(
      remaining === 1
        ? "Incorrect code. 1 attempt remaining."
        : `Incorrect code. ${remaining} attempts remaining.`,
    );
  }

  return otp;
}

async function attachRoleContext(
  user: { id: string; role: string },
  result: LoginResult,
): Promise<LoginResult> {
  if (user.role === "coach" || user.role === "nutrition_coach") {
    const profile = await coachProfilesRepository.findByUserId(user.id);
    if (profile) {
      result.coachProfile = {
        id: profile.id,
        title: profile.title,
        organization: profile.organization,
      };
    }
    return result;
  }

  if (user.role === "consumer" || user.role === "organization_admin") {
    const profile = await ensureConsumerProfileForUser(user.id);
    result.user.patientId = profile.id;
    result.consumerProfile = {
      patientId: profile.id,
      onboardingComplete: resolveOnboardingComplete(profile.profile),
    };
  }

  return result;
}

export const authService = {
  async register(dto: RegisterDto, req?: Request): Promise<LoginResult> {
    const email = dto.email.toLowerCase().trim();
    const existing = await usersRepository.findByEmail(email);
    if (existing) {
      throw new BadRequestError("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let referrer: Awaited<ReturnType<typeof usersRepository.findByReferralCode>> | null = null;
    if (dto.referralCode?.trim()) {
      referrer = await usersRepository.findByReferralCode(dto.referralCode.trim());
      if (!referrer || referrer.role !== "consumer") {
        throw new BadRequestError("Invalid referral code");
      }
    }

    let referralCode = generateReferralCode();
    while (await usersRepository.findByReferralCode(referralCode)) {
      referralCode = generateReferralCode();
    }

    const registrationSource = dto.referralCode?.trim()
      ? "referral"
      : dto.registrationSource ?? "individual";

    const user = usersRepository.create({
      email,
      passwordHash,
      role: "consumer",
      displayName: dto.displayName.trim(),
      avatarUrl: null,
      isActive: true,
      referralCode,
      referredByUserId: referrer?.id ?? null,
      registrationSource,
    });
    await usersRepository.save(user);

    let patientId = generatePatientId();
    while (await consumerProfilesRepository.findById(patientId)) {
      patientId = generatePatientId();
    }

    const now = new Date().toISOString();
    const consumerProfile = consumerProfilesRepository.create({
      id: patientId,
      userId: user.id,
      profile: {
        displayName: user.displayName,
        email: user.email,
        onboardingComplete: false,
        createdAt: now,
        updatedAt: now,
      },
      dashboard: {
        waterMl: 0,
        streakDays: 0,
      },
    });
    await consumerProfilesRepository.save(consumerProfile);

    if (referrer) {
      try {
        await notificationsService.notifyReferralSignup(referrer.id, user.displayName);
      } catch (err) {
        logger.error({ err, referrerId: referrer.id }, "Failed to notify referrer");
      }
    }

    try {
      await emailService.sendWelcomeEmail(user.email, {
        displayName: user.displayName,
        patientId,
      });
    } catch (err) {
      logger.error({ err, email: user.email }, "Failed to send welcome email");
    }

    const session = await createSession(user.id, req);
    const token = signAuthToken({
      sub: user.id,
      sid: session.id,
      role: user.role,
    });

    const result: LoginResult = {
      token,
      user: toAuthUser(user, patientId),
      consumerProfile: {
        patientId,
        onboardingComplete: false,
      },
    };

    return result;
  },

  async login(dto: LoginDto, req?: Request): Promise<LoginResult | MfaChallengeResult> {
    const email = dto.email.toLowerCase().trim();
    const user = await usersRepository.findByEmail(email);
    if (!user?.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }
    if (!user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Seed/demo accounts (coach@, admin@, …) skip email OTP even when MFA is on.
    const isSeedUser =
      user.registrationSource === "seed" || isSeedLoginEmail(user.email);
    if (env.MFA_REQUIRED_FOR_STAFF && isStaffRole(user.role) && !isSeedUser) {
      void purgeExpiredOtps().catch(() => undefined);
      const recent = await recentlyIssuedOtp(user.id);
      if (recent) {
        const waitSec = Math.ceil(
          (recent.createdAt.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now()) / 1000,
        );
        throw new BadRequestError(
          `Please wait ${Math.max(waitSec, 1)} seconds before requesting another code.`,
        );
      }

      const code = generateOtpCode();
      await createPasswordResetOtp({
        userId: user.id,
        email: user.email,
        code,
      });

      let debugCode: string | undefined;
      try {
        await emailService.sendStaffLoginOtpEmail(user.email, {
          code,
          firstName: user.displayName?.trim().split(/\s+/)[0] || null,
        });
      } catch (err) {
        logger.error({ err, email: user.email }, "Failed to send staff MFA email");
        if (env.NODE_ENV !== "production") {
          debugCode = code;
          logger.warn({ email: user.email, debugCode: code }, "MFA debug code (dev only)");
        } else {
          throw new BadRequestError("Unable to send verification code. Try again shortly.");
        }
      }

      await adminAuditService.log(user.id, "auth.mfa_challenge_issued", {
        targetType: "user",
        targetId: user.id,
        req,
      });

      return {
        mfaRequired: true,
        challengeToken: signMfaChallengeToken(user.id),
        email: user.email,
        ...(debugCode ? { debugCode } : {}),
      };
    }

    const session = await createSession(user.id, req);
    const token = signAuthToken({
      sub: user.id,
      sid: session.id,
      role: user.role,
    });

    const result: LoginResult = {
      token,
      user: toAuthUser(user),
    };

    return attachRoleContext(user, result);
  },

  async verifyMfa(dto: VerifyMfaDto, req?: Request): Promise<LoginResult> {
    const { sub: userId } = verifyMfaChallengeToken(dto.challengeToken.trim());
    const user = await usersRepository.findById(userId);
    if (!user?.passwordHash || !user.isActive) {
      throw new UnauthorizedError("Invalid or expired verification challenge");
    }

    const otp = await findLatestOpenOtp(user.email);
    if (!otp) {
      throw new BadRequestError("Verification code expired. Sign in again.");
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestError("Too many attempts. Sign in again.");
    }

    const ok = await verifyOtpCode(dto.code.trim(), otp.codeHash);
    if (!ok) {
      await incrementOtpAttempts(otp);
      throw new UnauthorizedError("Invalid verification code");
    }

    await markOtpConsumed(otp);
    await invalidateOpenOtps(user.id);

    const session = await createSession(user.id, req);
    const token = signAuthToken({
      sub: user.id,
      sid: session.id,
      role: user.role,
    });

    await adminAuditService.log(user.id, "auth.mfa_verified", {
      targetType: "user",
      targetId: user.id,
      req,
      meta: { fingerprint: otpFingerprint(dto.code.trim()) },
    });

    return attachRoleContext(user, {
      token,
      user: toAuthUser(user),
    });
  },

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ ok: true }> {
    const email = dto.email.toLowerCase().trim();
    void purgeExpiredOtps().catch(() => undefined);

    const user = await usersRepository.findByEmail(email);
    // Always succeed to avoid account enumeration.
    if (!user?.passwordHash || !user.isActive) {
      return { ok: true };
    }

    const recent = await recentlyIssuedOtp(user.id);
    if (recent) {
      const waitSec = Math.ceil(
        (recent.createdAt.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now()) / 1000,
      );
      throw new BadRequestError(
        `Please wait ${Math.max(waitSec, 1)} seconds before requesting another code.`,
      );
    }

    const code = generateOtpCode();
    const firstName = user.displayName?.trim().split(/\s+/)[0] || null;

    await createPasswordResetOtp({
      userId: user.id,
      email: user.email,
      code,
    });

    try {
      await emailService.sendPasswordResetOtpEmail(user.email, {
        code,
        firstName,
      });
    } catch (err) {
      await invalidateOpenOtps(user.id);
      logger.error({ err, email: user.email }, "Failed to send password reset OTP email");
      throw new BadRequestError("Could not send reset email. Try again later.");
    }

    logger.info(
      { email: user.email, otpFp: otpFingerprint(code) },
      "Password reset OTP issued",
    );

    return { ok: true };
  },

  async verifyResetCode(dto: VerifyResetCodeDto): Promise<{ ok: true }> {
    await assertValidResetOtp(dto.email, dto.code);
    return { ok: true };
  },

  async resetPassword(dto: ResetPasswordDto): Promise<{ ok: true }> {
    const otp = await assertValidResetOtp(dto.email, dto.code);
    const user = await usersRepository.findById(otp.userId);
    if (!user?.passwordHash || !user.isActive) {
      throw new BadRequestError("Invalid or expired code. Request a new one.");
    }

    user.passwordHash = await bcrypt.hash(dto.password, 10);
    await usersRepository.save(user);
    await markOtpConsumed(otp);
    await invalidateOpenOtps(user.id);
    const revoked = await authRepository.revokeAllForUser(user.id);
    logger.info({ userId: user.id, revokedSessions: revoked }, "Password reset completed");

    return { ok: true };
  },

  async logout(sessionId: string): Promise<void> {
    const session = await authRepository.findById(sessionId);
    if (!session || session.revokedAt) return;
    session.revokedAt = new Date();
    await authRepository.save(session);
  },

  async me(
    userId: string,
  ): Promise<LoginResult["user"] & {
    coachProfile?: LoginResult["coachProfile"];
    consumerProfile?: LoginResult["consumerProfile"];
  }> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const base = toAuthUser(user);
    const result: LoginResult = { token: "", user: base };
    await attachRoleContext(user, result);

    return {
      ...result.user,
      coachProfile: result.coachProfile,
      consumerProfile: result.consumerProfile,
    };
  },
};
