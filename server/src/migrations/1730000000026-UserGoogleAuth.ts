import { MigrationInterface, QueryRunner } from "typeorm";

export class UserGoogleAuth1730000000026 implements MigrationInterface {
  name = "UserGoogleAuth1730000000026";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS google_sub varchar(128)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub
      ON users (google_sub)
      WHERE google_sub IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_google_sub`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS google_sub`);
  }
}
