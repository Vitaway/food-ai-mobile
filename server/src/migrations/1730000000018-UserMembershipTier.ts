import type { MigrationInterface, QueryRunner } from "typeorm";

export class UserMembershipTier1730000000018 implements MigrationInterface {
  name = "UserMembershipTier1730000000018";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS membership_tier varchar(16) NOT NULL DEFAULT 'standard'
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_membership_tier ON users (membership_tier)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_membership_tier`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS membership_tier`);
  }
}
