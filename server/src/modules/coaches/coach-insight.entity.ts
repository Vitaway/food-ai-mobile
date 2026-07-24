import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("coach_insights")
export class CoachInsight {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "coach_user_id", type: "uuid" })
  coachUserId!: string;

  @Column({ name: "client_id", type: "varchar", length: 64 })
  clientId!: string;

  @Column({ type: "varchar", length: 24, default: "coach_note" })
  type!: "tip" | "celebration" | "reminder" | "coach_note" | "trend";

  @Column({ type: "varchar", length: 160 })
  title!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ name: "read_at", type: "timestamptz", nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
