import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import { verifyAuthToken, resolveAuthUser } from "../middlewares/auth.middleware";
import { logger } from "../config/logger";

const clientsByUserId = new Map<string, Set<WebSocket>>();

export function attachChatWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/chat" });

  wss.on("connection", (ws, req) => {
    void (async () => {
      try {
        const host = req.headers.host ?? "localhost";
        const url = new URL(req.url ?? "/", `http://${host}`);
        const token = url.searchParams.get("token");
        if (!token) {
          ws.close(4401, "Unauthorized");
          return;
        }

        const payload = verifyAuthToken(token);
        const user = await resolveAuthUser(payload);
        if (user.role !== "coach" && user.role !== "consumer") {
          ws.close(4403, "Forbidden");
          return;
        }

        let sockets = clientsByUserId.get(user.id);
        if (!sockets) {
          sockets = new Set();
          clientsByUserId.set(user.id, sockets);
        }
        sockets.add(ws);

        ws.on("close", () => {
          sockets?.delete(ws);
          if (sockets?.size === 0) {
            clientsByUserId.delete(user.id);
          }
        });
      } catch (err) {
        logger.debug({ err }, "Chat WebSocket auth failed");
        ws.close(4401, "Unauthorized");
      }
    })();
  });
}

export function broadcastChatToUsers(
  userIds: string[],
  message: Record<string, unknown>,
) {
  const payload = JSON.stringify(message);
  const seen = new Set<string>();

  for (const userId of userIds) {
    if (seen.has(userId)) continue;
    seen.add(userId);

    const sockets = clientsByUserId.get(userId);
    if (!sockets?.size) continue;

    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }
}

export function broadcastChatUnread(userId: string, unreadCount: number) {
  broadcastChatToUsers([userId], { type: "unread_count", unreadCount });
}
