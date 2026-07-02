import "reflect-metadata";
import http from "http";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { AppDataSource } from "./config/database";
import { redisService } from "./services/redis.service";
import { attachNotificationWebSocket } from "./services/notification-realtime.service";

async function bootstrap() {
  redisService.connect();

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    logger.info("Database connected");
  }

  if (env.AUTO_RUN_MIGRATIONS) {
    await AppDataSource.runMigrations();
    logger.info("Migrations applied");
  }

  const server = http.createServer(app);
  attachNotificationWebSocket(server);

  server.listen(env.PORT, () => {
    logger.info(
      `MiraFood API listening on http://0.0.0.0:${env.PORT} (env=${env.NODE_ENV})`,
    );
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
