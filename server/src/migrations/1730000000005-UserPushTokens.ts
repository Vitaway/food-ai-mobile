import { MigrationInterface, QueryRunner } from "typeorm";

export class UserPushTokens1730000000005 implements MigrationInterface {
  name = "UserPushTokens1730000000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_push_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token varchar(255) NOT NULL,
        platform varchar(16) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_push_tokens_token
        ON user_push_tokens(token)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id
        ON user_push_tokens(user_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_push_tokens`);
  }
}
