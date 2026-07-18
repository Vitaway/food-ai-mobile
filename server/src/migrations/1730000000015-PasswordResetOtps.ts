import type { MigrationInterface, QueryRunner } from "typeorm";

export class PasswordResetOtps1730000000015 implements MigrationInterface {
  name = "PasswordResetOtps1730000000015";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS password_reset_otps (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email varchar(255) NOT NULL,
        code_hash varchar(255) NOT NULL,
        attempts int NOT NULL DEFAULT 0,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user_id ON password_reset_otps(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS password_reset_otps`);
  }
}
