import { BadRequestError } from "routing-controllers";

/** Normalize to E.164-ish +digits (8–15 national digits after country code). */
export function normalizePhone(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return null;

  const digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
  if (!/^\d{8,15}$/.test(digits)) {
    throw new BadRequestError("Phone must be 8–15 digits including country code (e.g. +250788123456)");
  }

  return `+${digits}`;
}
