import { MigrationInterface, QueryRunner } from "typeorm";

export class MealsAndCoachProfileFields1730000000001 implements MigrationInterface {
  name = "MealsAndCoachProfileFields1730000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE coach_profiles
        ADD COLUMN IF NOT EXISTS phone varchar(32),
        ADD COLUMN IF NOT EXISTS timezone varchar(64)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS consumer_profiles (
        id varchar(64) PRIMARY KEY,
        profile jsonb NOT NULL,
        dashboard jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meal_submissions (
        id varchar(64) PRIMARY KEY,
        client_id varchar(64) NOT NULL,
        status varchar(32) NOT NULL,
        meal_type varchar(32) NOT NULL,
        submitted_at timestamptz NOT NULL,
        data jsonb NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meal_submissions_client_id ON meal_submissions(client_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_meal_submissions_status ON meal_submissions(status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS meal_submissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS consumer_profiles`);
    await queryRunner.query(`ALTER TABLE coach_profiles DROP COLUMN IF EXISTS phone`);
    await queryRunner.query(`ALTER TABLE coach_profiles DROP COLUMN IF EXISTS timezone`);
  }
}
