import type { MigrationInterface, QueryRunner } from "typeorm";

export class CoachInsights1730000000021 implements MigrationInterface {
  name = "CoachInsights1730000000021";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS coach_insights (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        coach_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id varchar(64) NOT NULL REFERENCES consumer_profiles(id) ON DELETE CASCADE,
        type varchar(24) NOT NULL DEFAULT 'coach_note',
        title varchar(160) NOT NULL,
        body text NOT NULL,
        read_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_coach_insights_client_created
        ON coach_insights(client_id, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_coach_insights_coach_created
        ON coach_insights(coach_user_id, created_at DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS coach_insights`);
  }
}
