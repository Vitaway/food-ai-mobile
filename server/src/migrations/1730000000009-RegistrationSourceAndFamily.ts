import type { MigrationInterface, QueryRunner } from "typeorm";

export class RegistrationSourceAndFamily1730000000009 implements MigrationInterface {
  name = "RegistrationSourceAndFamily1730000000009";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS registration_source varchar(32) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE nutrition_foods
      ADD COLUMN IF NOT EXISTS image_url varchar(512) NULL,
      ADD COLUMN IF NOT EXISTS barcode varchar(64) NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(160) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS family_subscription_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        user_id uuid NOT NULL,
        role varchar(16) NOT NULL DEFAULT 'member',
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (subscription_id, user_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_family_subscription_members_user
      ON family_subscription_members(user_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS family_subscription_members`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizations`);
    await queryRunner.query(`ALTER TABLE nutrition_foods DROP COLUMN IF EXISTS barcode`);
    await queryRunner.query(`ALTER TABLE nutrition_foods DROP COLUMN IF EXISTS image_url`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS registration_source`);
  }
}
