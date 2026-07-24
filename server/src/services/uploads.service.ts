import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Request } from "express";
import { BadRequestError } from "routing-controllers";
import { env } from "../config/env";

const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");
const MEAL_PHOTOS_DIR = path.join(process.cwd(), "uploads", "meals");
const NUTRITION_FOOD_DIR = path.join(process.cwd(), "uploads", "nutrition-foods");
const CHAT_ATTACHMENTS_DIR = path.join(process.cwd(), "uploads", "chat");
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_MEAL_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_NUTRITION_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_CHAT_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const CHAT_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const CHAT_FILE_MIMES = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function ensureAvatarDir() {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

function ensureMealPhotosDir() {
  fs.mkdirSync(MEAL_PHOTOS_DIR, { recursive: true });
}

function ensureNutritionFoodDir() {
  fs.mkdirSync(NUTRITION_FOOD_DIR, { recursive: true });
}

function ensureChatAttachmentsDir() {
  fs.mkdirSync(CHAT_ATTACHMENTS_DIR, { recursive: true });
}

function extensionForAttachment(mime: string, originalName?: string): string {
  if (mime.startsWith("image/")) return extensionForMime(mime);
  if (mime === "application/pdf") return "pdf";
  if (mime === "text/plain") return "txt";
  if (mime === "application/msword") return "doc";
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "docx";
  }
  if (mime === "application/vnd.ms-excel") return "xls";
  if (mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return "xlsx";
  }

  if (originalName) {
    const ext = path.extname(originalName).slice(1).toLowerCase();
    if (ext && /^[a-z0-9]+$/.test(ext)) return ext;
  }

  return "bin";
}

function inferMimeFromFilename(name: string): string | null {
  const ext = path.extname(name).slice(1).toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "pdf") return "application/pdf";
  if (ext === "txt") return "text/plain";
  if (ext === "doc") return "application/msword";
  if (ext === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (ext === "xls") return "application/vnd.ms-excel";
  if (ext === "xlsx") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return null;
}

function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return base || "attachment";
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

export function saveMealPhoto(
  buffer: Buffer,
  mimeType: string,
  mealId: string,
  clientId: string,
  req?: Request,
): { imageUrl: string } {
  if (!buffer.length) {
    throw new BadRequestError("Empty image file");
  }
  if (buffer.length > MAX_MEAL_PHOTO_BYTES) {
    throw new BadRequestError("Image must be 8 MB or smaller");
  }

  const mime = mimeType?.startsWith("image/") ? mimeType : "image/jpeg";
  ensureMealPhotosDir();

  const safeMealId = mealId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || randomUUID();
  const filename = `${clientId}-${safeMealId}-${randomUUID()}.${extensionForMime(mime)}`;
  const filePath = path.join(MEAL_PHOTOS_DIR, filename);
  fs.writeFileSync(filePath, buffer);

  const base = publicApiBaseUrl(req);
  return { imageUrl: `${base}/uploads/meals/${filename}` };
}

/** Resolve a stored meal photo URL to a local buffer (for coach AI assist). */
export function readMealPhotoFromUrl(imageUrl: string): { buffer: Buffer; mimeType: string } | null {
  const match = imageUrl.match(/\/uploads\/meals\/([^/?#]+)/i);
  if (!match) return null;
  const filename = path.basename(match[1]);
  if (!filename || filename.includes("..")) return null;
  const filePath = path.join(MEAL_PHOTOS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const ext = path.extname(filename).toLowerCase();
  const mimeType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".gif"
          ? "image/gif"
          : "image/jpeg";
  return { buffer: fs.readFileSync(filePath), mimeType };
}

export function saveNutritionFoodImage(
  buffer: Buffer,
  mimeType: string,
  foodId: string,
  req?: Request,
): { imageUrl: string } {
  if (!buffer.length) throw new BadRequestError("Empty image file");
  if (buffer.length > MAX_NUTRITION_IMAGE_BYTES) {
    throw new BadRequestError("Image must be 5 MB or smaller");
  }

  const mime = mimeType?.startsWith("image/") ? mimeType : "image/jpeg";
  ensureNutritionFoodDir();

  const safeId = foodId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || randomUUID();
  const filename = `${safeId}-${randomUUID()}.${extensionForMime(mime)}`;
  const filePath = path.join(NUTRITION_FOOD_DIR, filename);
  fs.writeFileSync(filePath, buffer);

  const base = publicApiBaseUrl(req);
  return { imageUrl: `${base}/uploads/nutrition-foods/${filename}` };
}

export function saveChatAttachment(
  buffer: Buffer,
  mimeType: string,
  conversationId: string,
  originalName: string | undefined,
  req?: Request,
): {
  attachmentUrl: string;
  attachmentName: string;
  attachmentMime: string;
  attachmentKind: "image" | "file";
} {
  if (!buffer.length) {
    throw new BadRequestError("Empty file");
  }
  if (buffer.length > MAX_CHAT_ATTACHMENT_BYTES) {
    throw new BadRequestError("Attachment must be 10 MB or smaller");
  }

  const mime = mimeType?.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
  const resolvedMime =
    mime === "application/octet-stream"
      ? inferMimeFromFilename(originalName ?? "") ?? mime
      : mime;
  const isImage = CHAT_IMAGE_MIMES.has(resolvedMime) || resolvedMime.startsWith("image/");
  const isFile = CHAT_FILE_MIMES.has(resolvedMime);

  if (!isImage && !isFile) {
    throw new BadRequestError(
      "Unsupported file type. Use images (JPEG, PNG, WebP, GIF) or PDF, Word, Excel, or plain text.",
    );
  }

  ensureChatAttachmentsDir();

  const safeConversationId = conversationId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || randomUUID();
  const ext = extensionForAttachment(resolvedMime, originalName);
  const filename = `${safeConversationId}-${randomUUID()}.${ext}`;
  const filePath = path.join(CHAT_ATTACHMENTS_DIR, filename);
  fs.writeFileSync(filePath, buffer);

  const attachmentName = sanitizeFilename(originalName ?? `attachment.${ext}`);

  return {
    attachmentUrl: `/uploads/chat/${filename}`,
    attachmentName,
    attachmentMime: resolvedMime,
    attachmentKind: isImage ? "image" : "file",
  };
}
