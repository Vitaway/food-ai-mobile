import "reflect-metadata";
import { AppDataSource } from "../config/database";
import { logger } from "../config/logger";
import { importTfctFoods } from "../modules/nutrition-db/tfct-import.util";

async function main() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  await AppDataSource.runMigrations();
  const result = await importTfctFoods();
  logger.info(result, "TFCT import complete");
  await AppDataSource.destroy();
}

main().catch((err) => {
  logger.error({ err }, "TFCT import failed");
  process.exit(1);
});
