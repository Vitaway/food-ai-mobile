import { MigrationInterface, QueryRunner } from "typeorm";

export class ConsumerUserLink1730000000003 implements MigrationInterface {
  name = "ConsumerUserLink1730000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE consumer_profiles
        ADD COLUMN IF NOT EXISTS user_id uuid
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_consumer_profiles_user_id
        ON consumer_profiles(user_id)
        WHERE user_id IS NOT NULL
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_consumer_profiles_user'
        ) THEN
          ALTER TABLE consumer_profiles
            ADD CONSTRAINT fk_consumer_profiles_user
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE consumer_profiles DROP CONSTRAINT IF EXISTS fk_consumer_profiles_user
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_consumer_profiles_user_id`);
    await queryRunner.query(`ALTER TABLE consumer_profiles DROP COLUMN IF EXISTS user_id`);
  }
}
