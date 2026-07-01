import bcrypt from "bcryptjs";
import type { Request } from "express";
import { UnauthorizedError, ForbiddenError } from "routing-controllers";
import { signAuthToken } from "../../middlewares/auth.middleware";
import { usersRepository } from "../users/users.repository";
import { authRepository } from "./auth.repository";
import type { LoginDto } from "./auth.dto";
import { coachProfilesRepository } from "../coaches/coach-profiles.repository";

export interface AuthUserDto {
  id: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface LoginResult {
  token: string;
  user: AuthUserDto;
  coachProfile?: {
    id: string;
    title: string | null;
    organization: string | null;
  };
}

function toAuthUser(user: {
  id: string;
  email: string;
  role: string;
  displayName: string;
  avatarUrl: string | null;
}): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  };
}

export const authService = {
  async login(dto: LoginDto, req?: Request): Promise<LoginResult> {
    const email = dto.email.toLowerCase().trim();
    const user = await usersRepository.findByEmail(email);
    if (!user?.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }
    if (!user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }
    if (user.role !== "coach" && user.role !== "admin") {
      throw new ForbiddenError("This account cannot sign in to the dashboard");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const session = authRepository.create({
      userId: user.id,
      userAgent: req?.headers["user-agent"] ?? null,
      ip: req?.ip ?? null,
      revokedAt: null,
    });
    await authRepository.save(session);

    const token = signAuthToken({
      sub: user.id,
      sid: session.id,
      role: user.role,
    });

    const result: LoginResult = {
      token,
      user: toAuthUser(user),
    };

    if (user.role === "coach") {
      const profile = await coachProfilesRepository.findByUserId(user.id);
      if (profile) {
        result.coachProfile = {
          id: profile.id,
          title: profile.title,
          organization: profile.organization,
        };
      }
    }

    return result;
  },

  async logout(sessionId: string): Promise<void> {
    const session = await authRepository.findById(sessionId);
    if (!session || session.revokedAt) return;
    session.revokedAt = new Date();
    await authRepository.save(session);
  },

  async me(userId: string): Promise<LoginResult["user"] & { coachProfile?: LoginResult["coachProfile"] }> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }
    const base = toAuthUser(user);
    if (user.role !== "coach") return base;
    const profile = await coachProfilesRepository.findByUserId(user.id);
    if (!profile) return base;
    return {
      ...base,
      coachProfile: {
        id: profile.id,
        title: profile.title,
        organization: profile.organization,
      },
    };
  },
};
