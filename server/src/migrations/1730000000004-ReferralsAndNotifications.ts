import { MigrationInterface, QueryRunner } from "typeorm";

export class ReferralsAndNotifications1730000000004 implements MigrationInterface {
  name = "ReferralsAndNotifications1730000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS referral_code varchar(16),
        ADD COLUMN IF NOT EXISTS referred_by_user_id uuid
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code
        ON users(referral_code)
        WHERE referral_code IS NOT NULL
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_referred_by'
        ) THEN
          ALTER TABLE users
            ADD CONSTRAINT fk_users_referred_by
            FOREIGN KEY (referred_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind varchar(32) NOT NULL,
        title varchar(255) NOT NULL,
        message text NOT NULL,
        meal_id varchar(64),
        status varchar(32),
        data jsonb NOT NULL DEFAULT '{}',
        read_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id
        ON user_notifications(user_id, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
        ON user_notifications(user_id)
        WHERE read_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_notifications`);
    await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_referred_by`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_referral_code`);
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS referred_by_user_id,
        DROP COLUMN IF EXISTS referral_code
    `);
  }
}
