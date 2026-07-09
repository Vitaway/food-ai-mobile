import { MigrationInterface, QueryRunner } from "typeorm";

export class RoadmapCoreSchema1730000000008 implements MigrationInterface {
  name = "RoadmapCoreSchema1730000000008";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS nutrition_foods (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(160) NOT NULL,
        category varchar(80) NOT NULL,
        brand varchar(160),
        is_active boolean NOT NULL DEFAULT true,
        nutrition_per100g jsonb NOT NULL DEFAULT '{}'::jsonb,
        micronutrients jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_nutrition_foods_name ON nutrition_foods(name)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_nutrition_foods_category ON nutrition_foods(category)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS nutrition_serving_profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        food_id uuid NOT NULL REFERENCES nutrition_foods(id) ON DELETE CASCADE,
        unit varchar(32) NOT NULL,
        amount numeric(10,2) NOT NULL DEFAULT 1,
        grams_equivalent numeric(10,2) NOT NULL,
        is_default boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_nutrition_serving_food_id ON nutrition_serving_profiles(food_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS consumer_daily_health_scores (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id varchar(64) NOT NULL REFERENCES consumer_profiles(id) ON DELETE CASCADE,
        date date NOT NULL,
        nutrient_score numeric(6,2) NOT NULL DEFAULT 0,
        macro_score numeric(6,2) NOT NULL DEFAULT 0,
        calorie_score numeric(6,2) NOT NULL DEFAULT 0,
        consistency_score numeric(6,2) NOT NULL DEFAULT 0,
        variety_score numeric(6,2) NOT NULL DEFAULT 0,
        total_score numeric(6,2) NOT NULL DEFAULT 0,
        context jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_consumer_daily_health_scores_client_date UNIQUE (client_id, date)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_consumer_daily_health_scores_client_id ON consumer_daily_health_scores(client_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        organization_id varchar(64),
        plan_code varchar(64) NOT NULL,
        subscription_type varchar(24) NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'trialing',
        renews_on date,
        trial_ends_on date,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
        provider varchar(32) NOT NULL DEFAULT 'irembopay',
        external_ref varchar(128) NOT NULL UNIQUE,
        currency varchar(3) NOT NULL DEFAULT 'RWF',
        amount numeric(12,2) NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'pending',
        processed_at timestamptz,
        payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON payment_transactions(subscription_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS report_snapshots (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        scope_type varchar(24) NOT NULL,
        scope_id varchar(64) NOT NULL,
        period varchar(16) NOT NULL,
        period_start date NOT NULL,
        period_end date NOT NULL,
        metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_report_snapshots_scope_type ON report_snapshots(scope_type)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_report_snapshots_scope_id ON report_snapshots(scope_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS report_snapshots`);
    await queryRunner.query(`DROP TABLE IF EXISTS payment_transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS subscriptions`);
    await queryRunner.query(`DROP TABLE IF EXISTS consumer_daily_health_scores`);
    await queryRunner.query(`DROP TABLE IF EXISTS nutrition_serving_profiles`);
    await queryRunner.query(`DROP TABLE IF EXISTS nutrition_foods`);
  }
}
