import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "meal_review_tasks" })
export class MealReviewTask {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "meal_id", type: "varchar", length: 64 })
  mealId!: string;

  @Column({ name: "requester_coach_id", type: "uuid" })
  requesterCoachId!: string;

  @Column({ name: "assignee_coach_id", type: "uuid", nullable: true })
  assigneeCoachId!: string | null;

  @Column({ type: "varchar", length: 24 })
  type!: "second_opinion" | "escalation";

  @Column({ type: "varchar", length: 16, default: "open" })
  status!: "open" | "resolved";

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @Column({ name: "notify_user", type: "boolean", default: false })
  notifyUser!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
