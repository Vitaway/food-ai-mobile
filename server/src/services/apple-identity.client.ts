import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "routing-controllers";
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
    throw new UnauthorizedError("Unable to verify Apple identity token");
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

function asBool(value: boolean | string | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

/**
 * Verifies an Apple Sign In identity token (JWT) against Apple's JWKS.
 * Audience must match the iOS bundle id (or configured APPLE_CLIENT_IDS).
 */
export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleIdentityClaims> {
  const decoded = jwt.decode(identityToken, { complete: true });
  if (!decoded || typeof decoded === "string" || !decoded.header?.kid) {
    throw new UnauthorizedError("Invalid Apple identity token");
  }

  const keys = await fetchAppleJwks();
  const jwk = keys.find((k) => k.kid === decoded.header.kid);
  if (!jwk) {
    cachedKeys = null;
    const refreshed = await fetchAppleJwks();
    const retry = refreshed.find((k) => k.kid === decoded.header.kid);
    if (!retry) {
      throw new UnauthorizedError("Apple signing key not found");
    }
    return verifyWithKey(identityToken, retry);
  }

  return verifyWithKey(identityToken, jwk);
}

function verifyWithKey(identityToken: string, jwk: AppleJwk): AppleIdentityClaims {
  const audiences = env.APPLE_CLIENT_IDS;
  try {
    const payload = jwt.verify(identityToken, jwkToPem(jwk), {
      algorithms: ["RS256"],
      issuer: APPLE_ISSUER,
      audience: audiences.length === 1 ? audiences[0]! : ([audiences[0]!, ...audiences.slice(1)] as [
        string,
        ...string[],
      ]),
    }) as jwt.JwtPayload;

    if (!payload.sub || typeof payload.sub !== "string") {
      throw new UnauthorizedError("Invalid Apple identity token subject");
    }

    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email.toLowerCase() : undefined,
      email_verified: asBool(payload.email_verified as boolean | string | undefined),
      is_private_email: asBool(payload.is_private_email as boolean | string | undefined),
    };
  } catch (err) {
    logger.warn({ err }, "Apple identity token verification failed");
    throw new UnauthorizedError("Invalid or expired Apple identity token");
  }
}
