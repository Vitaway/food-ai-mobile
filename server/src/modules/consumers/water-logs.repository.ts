import { AppDataSource } from "../../config/database";
import { ConsumerWaterLog } from "./water-log.entity";

class WaterLogsRepository {
  private get repo() {
    return AppDataSource.getRepository(ConsumerWaterLog);
  }

  async totalForDate(clientId: string, date: string) {
    const result = await this.repo
      .createQueryBuilder("log")
      .select("COALESCE(SUM(log.amount_ml), 0)", "total")
      .where("log.client_id = :clientId", { clientId })
      .andWhere("log.date = :date", { date })
      .getRawOne<{ total: string }>();
    return Math.max(0, Number(result?.total ?? 0));
  }

  create(clientId: string, date: string, amountMl: number) {
    return this.repo.create({ clientId, date, amountMl });
  }

  save(log: ConsumerWaterLog) {
    return this.repo.save(log);
  }
}

export const waterLogsRepository = new WaterLogsRepository();
