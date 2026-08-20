import Redis from "ioredis";
import { randomUUID } from "crypto";
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

  private async ensureReady(): Promise<Redis | null> {
    if (!this.client || !this.enabled) return null;
    try {
      if (this.client.status !== "ready") {
        await this.client.connect();
      }
      return this.client;
    } catch {
      return null;
    }
  }

  async ping(): Promise<boolean> {
    const client = await this.ensureReady();
    if (!client) return false;
    try {
      const result = await client.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    const client = await this.ensureReady();
    if (!client) return null;
    try {
      return await client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    const client = await this.ensureReady();
    if (!client) return false;
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await client.set(key, value, "EX", ttlSeconds);
      } else {
        await client.set(key, value);
      }
      return true;
    } catch {
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
    try {
      return await this.set(key, JSON.stringify(value), ttlSeconds);
    } catch {
      return false;
    }
  }

  /** SET key value NX EX ttl — returns true when lock acquired. */
  async setNx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const client = await this.ensureReady();
    if (!client) return false;
    try {
      const result = await client.set(key, value, "EX", ttlSeconds, "NX");
      return result === "OK";
    } catch {
      return false;
    }
  }

  async del(key: string): Promise<void> {
    const client = await this.ensureReady();
    if (!client) return;
    try {
      await client.del(key);
    } catch {
      /* ignore */
    }
  }

  /** Poll until key exists or timeout — used for single-flight waiters. */
  async waitForValue(key: string, timeoutMs: number, intervalMs = 120): Promise<string | null> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const value = await this.get(key);
      if (value != null) return value;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return null;
  }

  /** Acquire a short-lived lock token; returns null when Redis unavailable (caller proceeds without lock). */
  async acquireLock(lockKey: string, ttlSeconds: number): Promise<string | null> {
    const token = randomUUID();
    const acquired = await this.setNx(lockKey, token, ttlSeconds);
    return acquired ? token : null;
  }

  async releaseLock(lockKey: string, token: string): Promise<void> {
    const client = await this.ensureReady();
    if (!client) return;
    try {
      const current = await client.get(lockKey);
      if (current === token) {
        await client.del(lockKey);
      }
    } catch {
      /* ignore */
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
