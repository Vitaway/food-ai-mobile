import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "user_notifications" })
export class UserNotification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", length: 32 })
  kind!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar", name: "meal_id", length: 64, nullable: true })
  mealId!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  status!: string | null;

  @Column({ type: "jsonb", default: {} })
  data!: Record<string, unknown>;

  @Column({ type: "timestamptz", name: "read_at", nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
