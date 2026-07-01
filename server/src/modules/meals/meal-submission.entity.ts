import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "meal_submissions" })
export class MealSubmission {
  @PrimaryColumn({ type: "varchar", length: 64 })
  id!: string;

  @Index()
  @Column({ type: "varchar", name: "client_id", length: 64 })
  clientId!: string;

  @Index()
  @Column({ type: "varchar", length: 32 })
  status!: string;

  @Column({ type: "varchar", name: "meal_type", length: 32 })
  mealType!: string;

  @Column({ type: "timestamptz", name: "submitted_at" })
  submittedAt!: Date;

  @Column({ type: "jsonb", default: {} })
  data!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
