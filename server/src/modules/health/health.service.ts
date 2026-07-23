import { AppDataSource } from "../../config/database";
import { redisService } from "../../services/redis.service";
import { env } from "../../config/env";
import { claudeService } from "../ai/claude.service";

export const healthService = {
  getStatus() {
    const apiKeyStatus = claudeService.getApiKeyStatus();
    return {
      ok: apiKeyStatus === "configured",
      provider: "anthropic",
      model: env.ANTHROPIC_MODEL,
      temperature: env.ANTHROPIC_TEMPERATURE,
      apiKeyStatus,
      timestamp: new Date().toISOString(),
    };
  },

  async getReadiness() {
    const timestamp = new Date().toISOString();
    let database = false;
    let redis = false;

    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.query("SELECT 1");
        database = true;
      }
    } catch {
      database = false;
    }

    try {
      redis = await redisService.ping();
    } catch {
      redis = false;
    }

    return {
      ok: database,
      checks: { database, redis },
      timestamp,
    };
  },

  getRuntimeMetrics() {
    const mem = process.memoryUsage();
    return {
      timestamp: new Date().toISOString(),
      process: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssBytes: mem.rss,
        memoryHeapUsedBytes: mem.heapUsed,
        memoryHeapTotalBytes: mem.heapTotal,
      },
      redis: redisService.getConnectionSummary(),
      database: {
        initialized: AppDataSource.isInitialized,
      },
    };
  },
};
