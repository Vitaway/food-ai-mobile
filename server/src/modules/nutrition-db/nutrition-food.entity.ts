import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { NutritionServingProfile } from "./nutrition-serving-profile.entity";

@Entity({ name: "nutrition_foods" })
export class NutritionFood {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Index()
  @Column({ type: "varchar", length: 80 })
  category!: string;

  @Column({ type: "varchar", length: 160, nullable: true })
  brand!: string | null;

  @Column({ type: "boolean", name: "is_active", default: true })
  isActive!: boolean;

  @Column({ type: "jsonb", name: "nutrition_per100g", default: {} })
  nutritionPer100g!: Record<string, number>;

  @Column({ type: "jsonb", default: {} })
  micronutrients!: Record<string, number>;

  @Column({ type: "varchar", name: "image_url", length: 512, nullable: true })
  imageUrl!: string | null;

  @Index()
  @Column({ type: "varchar", length: 64, nullable: true })
  barcode!: string | null;

  @Column({ type: "varchar", name: "approval_status", length: 16, default: "approved" })
  approvalStatus!: "approved" | "pending" | "rejected";

  @Column({ type: "uuid", name: "submitted_by_user_id", nullable: true })
  submittedByUserId!: string | null;

  @Column({ type: "uuid", name: "verified_by_user_id", nullable: true })
  verifiedByUserId!: string | null;

  @OneToMany(() => NutritionServingProfile, (serving) => serving.food)
  servings?: NutritionServingProfile[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
