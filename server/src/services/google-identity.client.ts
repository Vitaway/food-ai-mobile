import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "routing-controllers";
import { env } from "../config/env";
import { logger } from "../config/logger";

type GoogleJwk = {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  n: string;
  e: string;
};

type GoogleJwks = { keys: GoogleJwk[] };

export type GoogleIdentityClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

let cachedKeys: GoogleJwk[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

async function fetchGoogleJwks(): Promise<GoogleJwk[]> {
  if (cachedKeys && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedKeys;
  }
  const res = await fetch(GOOGLE_JWKS_URL);
  if (!res.ok) {
    throw new UnauthorizedError("Unable to verify Google sign-in right now. Please try again.");
  }
  const body = (await res.json()) as GoogleJwks;
  cachedKeys = body.keys ?? [];
  cachedAt = Date.now();
  return cachedKeys;
}

function jwkToPem(jwk: GoogleJwk): string {
  const keyObject = crypto.createPublicKey({
    key: { kty: jwk.kty, n: jwk.n, e: jwk.e },
    format: "jwk",
  });
  return keyObject.export({ type: "spki", format: "pem" }).toString();
}

function normalizeAudience(aud: unknown): string[] {
  if (typeof aud === "string") return [aud];
  if (Array.isArray(aud)) return aud.filter((v): v is string => typeof v === "string");
  return [];
}

export async function verifyGoogleIdentityToken(identityToken: string): Promise<GoogleIdentityClaims> {
  const decoded = jwt.decode(identityToken, { complete: true });
  if (!decoded || typeof decoded === "string" || !decoded.header?.kid) {
    throw new UnauthorizedError("Google sign-in failed. Please try again.");
  }

  const keys = await fetchGoogleJwks();
  let jwk = keys.find((k) => k.kid === decoded.header.kid);
  if (!jwk) {
    cachedKeys = null;
    const refreshed = await fetchGoogleJwks();
    jwk = refreshed.find((k) => k.kid === decoded.header.kid);
  }
  if (!jwk) {
    throw new UnauthorizedError("Google sign-in failed. Please try again.");
  }

  const allowed = new Set(env.GOOGLE_CLIENT_IDS);
  try {
    const payload = jwt.verify(identityToken, jwkToPem(jwk), {
      algorithms: ["RS256"],
      clockTolerance: 120,
    }) as jwt.JwtPayload;

    const iss = typeof payload.iss === "string" ? payload.iss : "";
    if (!GOOGLE_ISSUERS.includes(iss)) {
      throw new UnauthorizedError("Google sign-in failed. Please try again.");
    }

    const audiences = normalizeAudience(payload.aud);
    if (!audiences.some((aud) => allowed.has(aud))) {
      logger.warn(
        { tokenAud: audiences, allowed: env.GOOGLE_CLIENT_IDS },
        "Google identity token audience mismatch",
      );
      throw new UnauthorizedError("Google sign-in is misconfigured. Please contact support.");
    }

    if (!payload.sub || typeof payload.sub !== "string") {
      throw new UnauthorizedError("Google sign-in failed. Please try again.");
    }

    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email.toLowerCase() : undefined,
      email_verified: Boolean(payload.email_verified),
      name: typeof payload.name === "string" ? payload.name : undefined,
      picture: typeof payload.picture === "string" ? payload.picture : undefined,
    };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    logger.warn({ err }, "Google identity token verification failed");
    throw new UnauthorizedError("Google sign-in expired. Please try again.");
  }
}
