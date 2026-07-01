import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1730000000000 implements MigrationInterface {
  name = "InitialSchema1730000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) NOT NULL UNIQUE,
        password_hash varchar(255) NOT NULL,
        role varchar(32) NOT NULL DEFAULT 'coach',
        display_name varchar(255) NOT NULL,
        avatar_url varchar(512),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        user_agent varchar,
        ip varchar,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS coach_profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE,
        title varchar(255),
        organization varchar(255),
        bio text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON coach_profiles(user_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS coach_profiles`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
