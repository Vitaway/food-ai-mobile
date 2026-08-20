import { MigrationInterface, QueryRunner } from "typeorm";

export class UserAppleAuth1730000000025 implements MigrationInterface {
  name = "UserAppleAuth1730000000025";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN password_hash DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS apple_sub varchar(128)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_apple_sub
      ON users (apple_sub)
      WHERE apple_sub IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_apple_sub`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS apple_sub`);
    await queryRunner.query(`
      UPDATE users SET password_hash = '' WHERE password_hash IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN password_hash SET NOT NULL
    `);
  }
}
