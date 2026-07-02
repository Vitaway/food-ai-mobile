import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import { verifyAuthToken, resolveAuthUser } from "../middlewares/auth.middleware";
import { logger } from "../config/logger";

const clientsByUserId = new Map<string, Set<WebSocket>>();

export function attachNotificationWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/notifications" });

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
        if (user.role !== "consumer") {
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
        logger.debug({ err }, "Notification WebSocket auth failed");
        ws.close(4401, "Unauthorized");
      }
    })();
  });
}

export function broadcastToUser(userId: string, message: Record<string, unknown>) {
  const sockets = clientsByUserId.get(userId);
  if (!sockets?.size) return;

  const payload = JSON.stringify(message);
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}
