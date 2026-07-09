import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("chat_messages")
export class ChatMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "conversation_id", type: "uuid" })
  conversationId!: string;

  @Column({ name: "sender_user_id", type: "uuid" })
  senderUserId!: string;

  @Column({ type: "text", default: "" })
  body!: string;

  @Column({ name: "meal_id", type: "varchar", length: 64, nullable: true })
  mealId!: string | null;

  @Column({ name: "attachment_url", type: "text", nullable: true })
  attachmentUrl!: string | null;

  @Column({ name: "attachment_name", type: "varchar", length: 255, nullable: true })
  attachmentName!: string | null;

  @Column({ name: "attachment_mime", type: "varchar", length: 128, nullable: true })
  attachmentMime!: string | null;

  @Column({ name: "attachment_kind", type: "varchar", length: 16, nullable: true })
  attachmentKind!: "image" | "file" | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
