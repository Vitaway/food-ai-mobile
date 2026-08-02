import type { MigrationInterface, QueryRunner } from "typeorm";

export class SubscriptionPlans1730000000023 implements MigrationInterface {
  name = "SubscriptionPlans1730000000023";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        code varchar(64) PRIMARY KEY,
        label varchar(120) NOT NULL,
        amount numeric(12, 2) NOT NULL,
        currency varchar(3) NOT NULL DEFAULT 'RWF',
        subscription_type varchar(24) NOT NULL,
        interval_days int NOT NULL DEFAULT 30,
        is_public boolean NOT NULL DEFAULT true,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      INSERT INTO subscription_plans
        (code, label, amount, currency, subscription_type, interval_days, is_public, is_active)
      VALUES
        ('individual_weekly', 'Weekly', 5000, 'RWF', 'individual', 7, true, true),
        ('individual_monthly', 'Monthly', 15000, 'RWF', 'individual', 30, true, true),
        ('family_monthly', 'Family', 35000, 'RWF', 'family', 30, true, true),
        ('corporate_monthly', 'Corporate', 50000, 'RWF', 'corporate', 30, false, true)
      ON CONFLICT (code) DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS subscription_plans`);
  }
}
