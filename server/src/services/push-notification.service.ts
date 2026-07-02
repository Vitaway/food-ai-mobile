import { env } from "../config/env";
import { logger } from "../config/logger";
import { pushTokensRepository } from "../modules/notifications/push-tokens.repository";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

export const pushNotificationService = {
  async sendToUser(userId: string, payload: PushPayload) {
    const rows = await pushTokensRepository.findByUserId(userId);
    const tokens = rows.map((row) => row.token).filter((token) => token.startsWith("ExponentPushToken"));
    if (!tokens.length) return;

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (env.EXPO_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${env.EXPO_ACCESS_TOKEN}`;
    }

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(
          tokens.map((token) => ({
            to: token,
            title: payload.title,
            body: payload.body,
            data: payload.data ?? {},
            sound: "default",
            priority: "high",
            channelId: "default",
          })),
        ),
      });

      const body = (await response.json().catch(() => ({}))) as {
        data?: ExpoPushTicket[];
      };

      if (!response.ok) {
        logger.warn({ status: response.status, body }, "Expo push request failed");
        return;
      }

      const invalidTokens: string[] = [];
      const tickets = body.data ?? [];
      tickets.forEach((ticket, index) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          const token = tokens[index];
          if (token) invalidTokens.push(token);
        }
      });

      if (invalidTokens.length) {
        await pushTokensRepository.removeInvalidTokens(invalidTokens);
      }
    } catch (err) {
      logger.error({ err, userId }, "Failed to send Expo push notification");
    }
  },
};
