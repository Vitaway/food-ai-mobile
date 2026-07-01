import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Action } from "routing-controllers";
import { ForbiddenError, UnauthorizedError } from "routing-controllers";
import { env } from "../config/env";
import { AppDataSource } from "../config/database";
import { UserSession } from "../modules/auth/user-session.entity";
import { usersRepository } from "../modules/users/users.repository";

export type UserRole = "consumer" | "coach" | "admin";

export interface AuthJwtPayload {
  sub: string;
  sid: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export function signAuthToken(payload: Omit<AuthJwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAuthToken(token: string): AuthJwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthJwtPayload;
}

export async function resolveAuthUser(payload: AuthJwtPayload) {
  const sessionRepo = AppDataSource.getRepository(UserSession);
  const session = await sessionRepo.findOne({ where: { id: payload.sid } });
  if (!session || session.revokedAt) {
    throw new UnauthorizedError("Session expired");
  }
  const user = await usersRepository.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new UnauthorizedError("User not found");
  }
  return user;
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export function createAuthorizationChecker() {
  return async (action: Action, roles: string[]): Promise<boolean> => {
    const req = action.request as Request;
    const token = extractBearerToken(req);
    if (!token) return false;
    try {
      const payload = verifyAuthToken(token);
      const user = await resolveAuthUser(payload);
      (req as Request & { user?: typeof user; authPayload?: AuthJwtPayload }).user = user;
      (req as Request & { authPayload?: AuthJwtPayload }).authPayload = payload;
      if (!roles.length) return true;
      return roles.includes(user.role);
    } catch {
      return false;
    }
  };
}

export function createCurrentUserChecker() {
  return async (action: Action) => {
    const req = action.request as Request;
    const token = extractBearerToken(req);
    if (!token) return null;
    try {
      const payload = verifyAuthToken(token);
      return await resolveAuthUser(payload);
    } catch {
      return null;
    }
  };
}

export function requireRole(...roles: UserRole[]) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    const user = (_req as Request & { user?: { role: UserRole } }).user;
    if (!user || !roles.includes(user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }
    return next();
  };
}
