import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("meal_coach_reviews")
export class MealCoachReview {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "meal_id", type: "varchar", length: 64, unique: true })
  mealId!: string;

  @Column({ name: "coach_id", type: "uuid" })
  coachId!: string;

  @Column({ type: "varchar", length: 16 })
  action!: "approve" | "reject";

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @Column({ name: "training_note", type: "text", nullable: true })
  trainingNote!: string | null;

  @Column({ name: "meal_name", type: "varchar", length: 255, nullable: true })
  mealName!: string | null;

  @Column({ type: "jsonb", nullable: true })
  items!: Record<string, unknown>[] | null;

  @Column({ name: "total_nutrition", type: "jsonb", nullable: true })
  totalNutrition!: Record<string, number> | null;

  @Column({ name: "review_duration_seconds", type: "int", nullable: true })
  reviewDurationSeconds!: number | null;

  @Column({ name: "reviewed_at", type: "timestamptz" })
  reviewedAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
