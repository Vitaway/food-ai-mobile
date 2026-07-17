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

  /** Official TFCT food code — unique when present (upsert key for imports). */
  @Column({ type: "varchar", name: "food_code", length: 32, nullable: true })
  foodCode!: string | null;

  @Index()
  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Index()
  @Column({ type: "varchar", length: 80 })
  category!: string;

  @Column({ type: "varchar", name: "food_group", length: 16, nullable: true })
  foodGroup!: string | null;

  @Column({ type: "varchar", name: "food_group_name", length: 80, nullable: true })
  foodGroupName!: string | null;

  @Column({ type: "varchar", name: "recipe_note", length: 255, nullable: true })
  recipeNote!: string | null;

  /** TFCT | packaged | custom_local */
  @Index()
  @Column({ type: "varchar", name: "source_type", length: 32, default: "custom_local" })
  sourceType!: string;

  @Column({ type: "varchar", name: "applicable_countries", length: 64, nullable: true })
  applicableCountries!: string | null;

  @Column({ type: "varchar", name: "name_sw", length: 160, nullable: true })
  nameSw!: string | null;

  @Column({ type: "varchar", name: "name_rw", length: 160, nullable: true })
  nameRw!: string | null;

  @Column({ type: "varchar", name: "name_local_other", length: 160, nullable: true })
  nameLocalOther!: string | null;

  @Column({ type: "varchar", length: 160, nullable: true })
  brand!: string | null;

  @Column({ type: "boolean", name: "is_active", default: true })
  isActive!: boolean;

  /**
   * Per-100g composition. TFCT rows use snake_case keys matching the spreadsheet
   * (energy_kcal, protein_g, …). Legacy rows may still use camelCase.
   */
  @Column({ type: "jsonb", name: "nutrition_per100g", default: {} })
  nutritionPer100g!: Record<string, number>;

  /** Legacy micros blob; TFCT micros live in nutritionPer100g (snake_case). */
  @Column({ type: "jsonb", default: {} })
  micronutrients!: Record<string, number>;

  @Column({ type: "varchar", name: "image_url", length: 512, nullable: true })
  imageUrl!: string | null;

  @Column({ type: "boolean", name: "image_confirmed", default: false })
  imageConfirmed!: boolean;

  @Index()
  @Column({ type: "varchar", length: 64, nullable: true })
  barcode!: string | null;

  @Column({ type: "numeric", name: "package_size_g", precision: 10, scale: 2, nullable: true })
  packageSizeG!: string | null;

  @Column({ type: "varchar", name: "label_source", length: 160, nullable: true })
  labelSource!: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  source!: string | null;

  @Column({ type: "varchar", name: "source_version", length: 80, nullable: true })
  sourceVersion!: string | null;

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
