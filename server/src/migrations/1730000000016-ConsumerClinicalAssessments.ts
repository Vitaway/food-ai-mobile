import type { MigrationInterface, QueryRunner } from "typeorm";

export class ConsumerClinicalAssessments1730000000016 implements MigrationInterface {
  name = "ConsumerClinicalAssessments1730000000016";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS consumer_clinical_assessments (
        client_id varchar(64) PRIMARY KEY REFERENCES consumer_profiles(id) ON DELETE CASCADE,
        status varchar(16) NOT NULL DEFAULT 'incomplete',
        data jsonb NOT NULL DEFAULT '{}'::jsonb,
        target_snapshot jsonb NULL,
        last_edited_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        confirmed_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        confirmed_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_clinical_assessment_status
          CHECK (status IN ('incomplete', 'draft', 'confirmed'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clinical_assessments_status
        ON consumer_clinical_assessments(status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clinical_assessments_updated_at
        ON consumer_clinical_assessments(updated_at DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS consumer_clinical_assessments`);
  }
}
