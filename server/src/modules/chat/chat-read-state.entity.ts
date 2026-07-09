import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("chat_read_states")
export class ChatReadState {
  @PrimaryColumn({ name: "conversation_id", type: "uuid" })
  conversationId!: string;

  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "last_read_at", type: "timestamptz" })
  lastReadAt!: Date;
}
