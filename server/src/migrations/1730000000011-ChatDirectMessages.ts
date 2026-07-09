import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatDirectMessages1730000000011 implements MigrationInterface {
  name = "ChatDirectMessages1730000000011";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE chat_conversations
      ADD COLUMN IF NOT EXISTS peer_user_id uuid REFERENCES users(id) ON DELETE CASCADE
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_direct_thread
        ON chat_conversations(coach_user_id, peer_user_id)
        WHERE type = 'direct'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_chat_direct_thread`);
    await queryRunner.query(`
      ALTER TABLE chat_conversations
      DROP COLUMN IF EXISTS peer_user_id
    `);
  }
}
