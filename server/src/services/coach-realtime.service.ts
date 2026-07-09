import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import { verifyAuthToken, resolveAuthUser } from "../middlewares/auth.middleware";
import { logger } from "../config/logger";

const coachSocketsByUserId = new Map<string, Set<WebSocket>>();

export function attachCoachQueueWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/coach-queue" });

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
        if (user.role !== "coach") {
          ws.close(4403, "Forbidden");
          return;
        }

        let sockets = coachSocketsByUserId.get(user.id);
        if (!sockets) {
          sockets = new Set();
          coachSocketsByUserId.set(user.id, sockets);
        }
        sockets.add(ws);

        ws.on("close", () => {
          sockets?.delete(ws);
          if (sockets?.size === 0) {
            coachSocketsByUserId.delete(user.id);
          }
        });
      } catch (err) {
        logger.debug({ err }, "Coach queue WebSocket auth failed");
        ws.close(4401, "Unauthorized");
      }
    })();
  });
}

export function broadcastCoachQueueUpdate(
  coachUserId: string,
  message: Record<string, unknown>,
) {
  const sockets = coachSocketsByUserId.get(coachUserId);
  if (!sockets?.size) return;
  const payload = JSON.stringify(message);
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

export function broadcastCoachQueueToAll(message: Record<string, unknown>) {
  const payload = JSON.stringify(message);
  for (const sockets of coachSocketsByUserId.values()) {
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }
}
