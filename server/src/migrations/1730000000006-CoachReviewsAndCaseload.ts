import { MigrationInterface, QueryRunner } from "typeorm";

export class CoachReviewsAndCaseload1730000000006 implements MigrationInterface {
  name = "CoachReviewsAndCaseload1730000000006";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS meal_coach_reviews (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        meal_id varchar(64) NOT NULL UNIQUE REFERENCES meal_submissions(id) ON DELETE CASCADE,
        coach_id uuid NOT NULL REFERENCES users(id),
        action varchar(16) NOT NULL,
        note text,
        meal_name varchar(255),
        items jsonb,
        total_nutrition jsonb,
        review_duration_seconds int,
        reviewed_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_meal_coach_reviews_coach_id ON meal_coach_reviews(coach_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_meal_coach_reviews_reviewed_at ON meal_coach_reviews(reviewed_at)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cohorts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(128) NOT NULL,
        organization varchar(128),
        description text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cohort_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
        client_id varchar(64) NOT NULL REFERENCES consumer_profiles(id) ON DELETE CASCADE,
        joined_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(cohort_id, client_id)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_cohort_members_client_id ON cohort_members(client_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS coach_client_assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        coach_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id varchar(64) NOT NULL REFERENCES consumer_profiles(id) ON DELETE CASCADE,
        assigned_by uuid REFERENCES users(id),
        assigned_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(coach_user_id, client_id)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_coach ON coach_client_assignments(coach_user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_coach_client_assignments_client ON coach_client_assignments(client_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS coach_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        coach_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id varchar(64) NOT NULL REFERENCES consumer_profiles(id) ON DELETE CASCADE,
        sender_role varchar(16) NOT NULL,
        body text NOT NULL,
        meal_id varchar(64),
        read_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_coach_messages_thread ON coach_messages(coach_user_id, client_id, created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS coach_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS coach_client_assignments`);
    await queryRunner.query(`DROP TABLE IF EXISTS cohort_members`);
    await queryRunner.query(`DROP TABLE IF EXISTS cohorts`);
    await queryRunner.query(`DROP TABLE IF EXISTS meal_coach_reviews`);
  }
}
