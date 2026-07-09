import bcrypt from "bcryptjs";
import type { Request } from "express";
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from "routing-controllers";
import {
  signAuthToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from "../../middlewares/auth.middleware";
import { usersRepository } from "../users/users.repository";
import { authRepository } from "./auth.repository";
import type { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from "./auth.dto";
import { env } from "../../config/env";
import { coachProfilesRepository } from "../coaches/coach-profiles.repository";
import { consumerProfilesRepository } from "../consumers/consumer-profiles.repository";
import { resolveOnboardingComplete } from "../consumers/onboarding.util";
import { ensureConsumerProfileForUser } from "../consumers/ensure-consumer-profile.util";
import { generatePatientId } from "../../utils/patient-id";
import { logger } from "../../config/logger";
import { emailService } from "../../services/email.service";
import { generateReferralCode } from "../../utils/referral-code";
import { notificationsService } from "../notifications/notifications.service";

export interface AuthUserDto {
  id: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
  patientId?: string;
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

function toAuthUser(
  user: {
    id: string;
    email: string;
    role: string;
    displayName: string;
    avatarUrl: string | null;
  },
  patientId?: string,
): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
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

async function attachRoleContext(
  user: { id: string; role: string },
  result: LoginResult,
): Promise<LoginResult> {
  if (user.role === "coach") {
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

  if (user.role === "consumer") {
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

  async login(dto: LoginDto, req?: Request): Promise<LoginResult> {
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

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ ok: true }> {
    const email = dto.email.toLowerCase().trim();
    const user = await usersRepository.findByEmail(email);
    if (!user?.passwordHash || !user.isActive) {
      return { ok: true };
    }

    const token = signPasswordResetToken(user.id);
    const resetUrl = `${env.APP_URL.replace(/\/$/, "")}/forgot-password?token=${encodeURIComponent(token)}`;
    const mobileResetUrl = `${env.MOBILE_APP_SCHEME}://auth/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await emailService.sendPasswordResetEmail(user.email, resetUrl, mobileResetUrl);
    } catch (err) {
      logger.error({ err, email: user.email }, "Failed to send password reset email");
      if (env.NODE_ENV === "production") {
        throw new BadRequestError("Could not send reset email. Try again later.");
      }
    }

    return { ok: true };
  },

  async resetPassword(dto: ResetPasswordDto): Promise<{ ok: true }> {
    let userId: string;
    try {
      userId = verifyPasswordResetToken(dto.token);
    } catch {
      throw new BadRequestError("Invalid or expired reset link. Request a new one.");
    }

    const user = await usersRepository.findById(userId);
    if (!user?.passwordHash || !user.isActive) {
      throw new BadRequestError("Invalid or expired reset link. Request a new one.");
    }

    user.passwordHash = await bcrypt.hash(dto.password, 10);
    await usersRepository.save(user);
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
