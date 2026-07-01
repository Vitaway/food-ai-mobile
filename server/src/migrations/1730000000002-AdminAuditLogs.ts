import { MigrationInterface, QueryRunner } from "typeorm";

export class AdminAuditLogs1730000000002 implements MigrationInterface {
  name = "AdminAuditLogs1730000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_user_id uuid NOT NULL,
        action varchar(64) NOT NULL,
        target_type varchar(64),
        target_id varchar(64),
        meta jsonb,
        ip varchar,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id ON admin_audit_logs(admin_user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS admin_audit_logs`);
  }
}
