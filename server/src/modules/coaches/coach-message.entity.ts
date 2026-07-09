import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("coach_messages")
export class CoachMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "coach_user_id", type: "uuid" })
  coachUserId!: string;

  @Column({ name: "client_id", type: "varchar", length: 64 })
  clientId!: string;

  @Column({ name: "sender_role", type: "varchar", length: 16 })
  senderRole!: "coach" | "consumer";

  @Column({ type: "text" })
  body!: string;

  @Column({ name: "meal_id", type: "varchar", length: 64, nullable: true })
  mealId!: string | null;

  @Column({ name: "read_at", type: "timestamptz", nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
