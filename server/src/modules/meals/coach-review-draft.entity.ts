import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "coach_review_drafts" })
export class CoachReviewDraft {
  @PrimaryColumn({ name: "meal_id", type: "varchar", length: 64 })
  mealId!: string;

  @Column({ name: "coach_id", type: "uuid" })
  coachId!: string;

  @Column({ name: "meal_name", type: "varchar", length: 255, nullable: true })
  mealName!: string | null;

  @Column({ type: "jsonb", default: [] })
  items!: Record<string, unknown>[];

  @Column({ type: "text", nullable: true })
  note!: string | null;

  @Column({ name: "training_note", type: "text", nullable: true })
  trainingNote!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
