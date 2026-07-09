import { MigrationInterface, QueryRunner } from "typeorm";

export class DashboardOpsSchema1730000000010 implements MigrationInterface {
  name = "DashboardOpsSchema1730000000010";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE nutrition_foods
      ADD COLUMN IF NOT EXISTS approval_status varchar(16) NOT NULL DEFAULT 'approved',
      ADD COLUMN IF NOT EXISTS submitted_by_user_id uuid NULL,
      ADD COLUMN IF NOT EXISTS verified_by_user_id uuid NULL
    `);

    await queryRunner.query(`
      ALTER TABLE meal_coach_reviews
      ADD COLUMN IF NOT EXISTS training_note text NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meal_review_tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        meal_id varchar(64) NOT NULL,
        requester_coach_id uuid NOT NULL,
        assignee_coach_id uuid NULL,
        type varchar(24) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'open',
        note text NULL,
        notify_user boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_meal_review_tasks_meal ON meal_review_tasks(meal_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS coach_review_drafts (
        meal_id varchar(64) PRIMARY KEY,
        coach_id uuid NOT NULL,
        meal_name varchar(255) NULL,
        items jsonb NOT NULL DEFAULT '[]'::jsonb,
        note text NULL,
        training_note text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS coach_review_drafts`);
    await queryRunner.query(`DROP TABLE IF EXISTS meal_review_tasks`);
    await queryRunner.query(`ALTER TABLE meal_coach_reviews DROP COLUMN IF EXISTS training_note`);
    await queryRunner.query(`
      ALTER TABLE nutrition_foods
      DROP COLUMN IF EXISTS verified_by_user_id,
      DROP COLUMN IF EXISTS submitted_by_user_id,
      DROP COLUMN IF EXISTS approval_status
    `);
  }
}
