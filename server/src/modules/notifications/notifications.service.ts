import { NotFoundError } from "routing-controllers";
import { broadcastToUser } from "../../services/notification-realtime.service";
import { pushNotificationService } from "../../services/push-notification.service";
import { notificationsRepository } from "./notifications.repository";
import { pushTokensRepository } from "./push-tokens.repository";

export type CreateNotificationInput = {
  userId: string;
  kind: "meal" | "referral" | "system";
  title: string;
  message: string;
  mealId?: string | null;
  status?: string | null;
  data?: Record<string, unknown>;
};

function toDto(row: {
  id: string;
  kind: string;
  title: string;
  message: string;
  mealId: string | null;
  status: string | null;
  data: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    message: row.message,
    mealId: row.mealId,
    status: row.status,
    data: row.data,
    read: row.readAt !== null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function pushUnreadCount(userId: string) {
  const unreadCount = await notificationsRepository.countUnread(userId);
  broadcastToUser(userId, { type: "unread_count", unreadCount });
}

export const notificationsService = {
  async listForUser(userId: string) {
    const rows = await notificationsRepository.findByUserId(userId);
    return rows.map(toDto);
  },

  async getUnreadCount(userId: string) {
    return notificationsRepository.countUnread(userId);
  },

  async create(input: CreateNotificationInput) {
    const row = notificationsRepository.create({
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      message: input.message,
      mealId: input.mealId ?? null,
      status: input.status ?? null,
      data: input.data ?? {},
      readAt: null,
    });
    const saved = await notificationsRepository.save(row);
    const dto = toDto(saved);

    broadcastToUser(input.userId, { type: "notification", notification: dto });
    await pushUnreadCount(input.userId);

    void pushNotificationService
      .sendToUser(input.userId, {
        title: dto.title,
        body: dto.message,
        data: {
          notificationId: dto.id,
          kind: dto.kind,
          mealId: dto.mealId,
          status: dto.status,
        },
      })
      .catch(() => undefined);

    return dto;
  },

  async registerPushToken(userId: string, token: string, platform: string) {
    await pushTokensRepository.upsert(userId, token, platform);
    return { ok: true };
  },

  async unregisterPushToken(userId: string, token: string) {
    await pushTokensRepository.remove(userId, token);
    return { ok: true };
  },

  async markRead(userId: string, notificationId: string) {
    const row = await notificationsRepository.findByIdForUser(notificationId, userId);
    if (!row) {
      throw new NotFoundError("Notification not found");
    }
    if (!row.readAt) {
      row.readAt = new Date();
      await notificationsRepository.save(row);
      await pushUnreadCount(userId);
    }
    return toDto(row);
  },

  async markAllRead(userId: string) {
    await notificationsRepository.markAllRead(userId);
    await pushUnreadCount(userId);
    return { ok: true };
  },

  async notifyMealStatus(
    userId: string,
    meal: { id: string; mealName?: string; status: string },
  ) {
    const mealName = meal.mealName ?? "Your meal";
    const messages: Record<string, { title: string; message: string }> = {
      in_review: {
        title: mealName,
        message: "Your meal was submitted and is waiting for coach review.",
      },
      approved: {
        title: mealName,
        message: "Great news — your coach approved this meal.",
      },
      rejected: {
        title: mealName,
        message: "Your coach left feedback on this meal. Tap to review.",
      },
    };

    const copy = messages[meal.status];
    if (!copy) return null;

    return this.create({
      userId,
      kind: "meal",
      title: copy.title,
      message: copy.message,
      mealId: meal.id,
      status: meal.status,
    });
  },

  async notifyReferralSignup(referrerUserId: string, referredDisplayName: string) {
    return this.create({
      userId: referrerUserId,
      kind: "referral",
      title: "New referral",
      message: `${referredDisplayName} joined MiraFood using your code.`,
      data: { referredDisplayName },
    });
  },
};
