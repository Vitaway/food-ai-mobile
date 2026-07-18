import type { MigrationInterface, QueryRunner } from "typeorm";

export class ConsumerWaterLogs1730000000017 implements MigrationInterface {
  name = "ConsumerWaterLogs1730000000017";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS consumer_water_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id varchar(64) NOT NULL REFERENCES consumer_profiles(id) ON DELETE CASCADE,
        date date NOT NULL,
        amount_ml int NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_consumer_water_log_amount CHECK (amount_ml <> 0 AND ABS(amount_ml) <= 5000)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_consumer_water_logs_client_date
        ON consumer_water_logs(client_id, date)
    `);
    await queryRunner.query(`
      INSERT INTO consumer_water_logs (client_id, date, amount_ml)
      SELECT
        id,
        CURRENT_DATE,
        (dashboard->>'waterMl')::int
      FROM consumer_profiles
      WHERE
        dashboard ? 'waterMl'
        AND (dashboard->>'waterMl') ~ '^[0-9]+$'
        AND (dashboard->>'waterMl')::int > 0
        AND NOT EXISTS (
          SELECT 1
          FROM consumer_water_logs water
          WHERE water.client_id = consumer_profiles.id
            AND water.date = CURRENT_DATE
        )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS consumer_water_logs`);
  }
}
