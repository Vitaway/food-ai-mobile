import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "../config/logger";

class RedisService {
  private client: Redis | null = null;
  private enabled = false;

  connect(): void {
    if (this.client) return;
    try {
      this.client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
      this.client.on("error", (err) => {
        logger.debug({ err: err.message }, "Redis error");
      });
      this.enabled = true;
    } catch (err) {
      logger.warn({ err }, "Redis unavailable");
      this.enabled = false;
    }
  }

  async ping(): Promise<boolean> {
    if (!this.client || !this.enabled) return false;
    try {
      await this.client.connect();
      const result = await this.client.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }

  getConnectionSummary() {
    return {
      configured: Boolean(env.REDIS_URL),
      connected: this.enabled && this.client?.status === "ready",
      status: this.client?.status ?? "disconnected",
    };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
      this.client = null;
      this.enabled = false;
    }
  }
}

export const redisService = new RedisService();
