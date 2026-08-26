import crypto from "crypto";
import jwt from "jsonwebtoken";
import { BadRequestError, UnauthorizedError } from "routing-controllers";
import { env } from "../config/env";
import { logger } from "../config/logger";

type AppleJwk = {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  n: string;
  e: string;
};

type AppleJwks = { keys: AppleJwk[] };

export type AppleIdentityClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
};

const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
const APPLE_ISSUER = "https://appleid.apple.com";

let cachedKeys: AppleJwk[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

async function fetchAppleJwks(): Promise<AppleJwk[]> {
  if (cachedKeys && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedKeys;
  }
  const res = await fetch(APPLE_JWKS_URL);
  if (!res.ok) {
    throw new UnauthorizedError("Unable to verify Apple sign-in right now. Please try again.");
  }
  const body = (await res.json()) as AppleJwks;
  cachedKeys = body.keys ?? [];
  cachedAt = Date.now();
  return cachedKeys;
}

function jwkToPem(jwk: AppleJwk): string {
  const keyObject = crypto.createPublicKey({
    key: {
      kty: jwk.kty,
      n: jwk.n,
      e: jwk.e,
    },
    format: "jwk",
  });
  return keyObject.export({ type: "spki", format: "pem" }).toString();
}

const asBool = (value: boolean | string | undefined): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function normalizeAudience(aud: unknown): string[] {
  if (typeof aud === "string") return [aud];
  if (Array.isArray(aud)) return aud.filter((v): v is string => typeof v === "string");
  return [];
}

/**
 * Verifies an Apple Sign In identity token (JWT) against Apple's JWKS.
 * Audience must match the iOS bundle id (or configured APPLE_CLIENT_IDS).
 */
export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleIdentityClaims> {
  const decoded = jwt.decode(identityToken, { complete: true });
  if (!decoded || typeof decoded === "string" || !decoded.header?.kid) {
    throw new UnauthorizedError("Apple sign-in failed. Please try again.");
  }

  const unverified = decoded.payload as jwt.JwtPayload;
  const tokenAud = normalizeAudience(unverified.aud);
  const allowed = env.APPLE_CLIENT_IDS.length
    ? env.APPLE_CLIENT_IDS
    : ["com.vitaway.foodai"];

  // Fail fast with a clear message when the token was issued for another app
  // (common with Expo Go, which does not use com.vitaway.foodai).
  if (tokenAud.length && !tokenAud.some((aud) => allowed.includes(aud))) {
    logger.warn({ tokenAud, allowed }, "Apple identity token audience mismatch");
    throw new BadRequestError(
      "Apple sign-in must be used from the MiraFood app build (not Expo Go). Install the TestFlight or development build and try again.",
    );
  }

  const keys = await fetchAppleJwks();
  let jwk = keys.find((k) => k.kid === decoded.header.kid);
  if (!jwk) {
    cachedKeys = null;
    const refreshed = await fetchAppleJwks();
    jwk = refreshed.find((k) => k.kid === decoded.header.kid);
  }
  if (!jwk) {
    throw new UnauthorizedError("Apple sign-in failed. Please try again.");
  }

  try {
    const payload = jwt.verify(identityToken, jwkToPem(jwk), {
      algorithms: ["RS256"],
      issuer: APPLE_ISSUER,
      clockTolerance: 300,
    }) as jwt.JwtPayload;

    const verifiedAud = normalizeAudience(payload.aud);
    if (!verifiedAud.some((aud) => allowed.includes(aud))) {
      logger.warn({ tokenAud: verifiedAud, allowed }, "Apple identity token audience mismatch");
      throw new BadRequestError(
        "Apple sign-in must be used from the MiraFood app build (not Expo Go). Install the TestFlight or development build and try again.",
      );
    }

    if (!payload.sub || typeof payload.sub !== "string") {
      throw new UnauthorizedError("Apple sign-in failed. Please try again.");
    }

    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email.toLowerCase() : undefined,
      email_verified: asBool(payload.email_verified as boolean | string | undefined),
      is_private_email: asBool(payload.is_private_email as boolean | string | undefined),
    };
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof BadRequestError) throw err;

    const name = err && typeof err === "object" && "name" in err ? String((err as { name: string }).name) : "";
    logger.warn(
      {
        err,
        name,
        tokenAud,
        allowed,
        exp: unverified.exp,
        iat: unverified.iat,
        now: Math.floor(Date.now() / 1000),
      },
      "Apple identity token verification failed",
    );

    if (name === "TokenExpiredError") {
      throw new UnauthorizedError("Apple sign-in timed out. Please tap Continue with Apple again.");
    }
    if (name === "JsonWebTokenError") {
      throw new UnauthorizedError("Apple sign-in could not be verified. Please try again.");
    }
    throw new UnauthorizedError("Apple sign-in failed. Please try again.");
  }
}
