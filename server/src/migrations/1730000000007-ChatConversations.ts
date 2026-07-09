import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatConversations1730000000007 implements MigrationInterface {
  name = "ChatConversations1730000000007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type varchar(32) NOT NULL,
        title varchar(255),
        coach_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        client_id varchar(64) REFERENCES consumer_profiles(id) ON DELETE CASCADE,
        organization varchar(128),
        last_message_at timestamptz,
        last_message_preview text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_patient_thread
        ON chat_conversations(coach_user_id, client_id)
        WHERE type = 'patient'
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_team_channel
        ON chat_conversations(organization)
        WHERE type = 'team'
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message
        ON chat_conversations(last_message_at DESC NULLS LAST)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        sender_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body text NOT NULL,
        meal_id varchar(64),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
        ON chat_messages(conversation_id, created_at)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_read_states (
        conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_read_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (conversation_id, user_id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS chat_read_states`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_conversations`);
  }
}
