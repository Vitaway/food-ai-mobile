import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Request } from "express";
import { BadRequestError } from "routing-controllers";
import { env } from "../config/env";

const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function ensureAvatarDir() {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

export function publicApiBaseUrl(req?: Request): string {
  const configured = process.env.PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;

  if (req) {
    const proto = (req.get("x-forwarded-proto") ?? req.protocol ?? "http").split(",")[0].trim();
    const host = (req.get("x-forwarded-host") ?? req.get("host") ?? "").split(",")[0].trim();
    if (host) return `${proto}://${host}`;
  }

  return `http://127.0.0.1:${env.PORT}`;
}

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function saveConsumerAvatar(
  buffer: Buffer,
  mimeType: string,
  userId: string,
  req?: Request,
): { avatarUrl: string } {
  if (!buffer.length) {
    throw new BadRequestError("Empty image file");
  }
  if (buffer.length > MAX_AVATAR_BYTES) {
    throw new BadRequestError("Image must be 5 MB or smaller");
  }

  const mime = mimeType?.startsWith("image/") ? mimeType : "image/jpeg";
  ensureAvatarDir();

  const filename = `${userId}-${randomUUID()}.${extensionForMime(mime)}`;
  const filePath = path.join(AVATAR_DIR, filename);
  fs.writeFileSync(filePath, buffer);

  const base = publicApiBaseUrl(req);
  return { avatarUrl: `${base}/uploads/avatars/${filename}` };
}
