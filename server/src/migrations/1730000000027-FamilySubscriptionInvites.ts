import { MigrationInterface, QueryRunner } from "typeorm";

export class FamilySubscriptionInvites1730000000027 implements MigrationInterface {
  name = "FamilySubscriptionInvites1730000000027";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS family_subscription_invites (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id uuid NOT NULL,
        inviter_user_id uuid NOT NULL,
        email varchar(320) NOT NULL,
        token_hash varchar(128) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'pending',
        expires_at timestamptz NOT NULL,
        accepted_at timestamptz NULL,
        accepted_user_id uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_family_invites_token_hash
      ON family_subscription_invites (token_hash)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_family_invites_subscription_status
      ON family_subscription_invites (subscription_id, status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_family_invites_email_pending
      ON family_subscription_invites (email)
      WHERE status = 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_family_invites_email_pending`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_family_invites_subscription_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_family_invites_token_hash`);
    await queryRunner.query(`DROP TABLE IF EXISTS family_subscription_invites`);
  }
}
