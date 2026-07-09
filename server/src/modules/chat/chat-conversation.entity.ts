import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type ChatConversationType = "patient" | "team" | "direct";

@Entity("chat_conversations")
export class ChatConversation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 32 })
  type!: ChatConversationType;

  @Column({ type: "varchar", length: 255, nullable: true })
  title!: string | null;

  @Column({ name: "coach_user_id", type: "uuid", nullable: true })
  coachUserId!: string | null;

  @Column({ name: "client_id", type: "varchar", length: 64, nullable: true })
  clientId!: string | null;

  @Column({ name: "peer_user_id", type: "uuid", nullable: true })
  peerUserId!: string | null;

  @Column({ type: "varchar", length: 128, nullable: true })
  organization!: string | null;

  @Column({ name: "last_message_at", type: "timestamptz", nullable: true })
  lastMessageAt!: Date | null;

  @Column({ name: "last_message_preview", type: "text", nullable: true })
  lastMessagePreview!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
