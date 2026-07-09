import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { NutritionFood } from "./nutrition-food.entity";

@Entity({ name: "nutrition_serving_profiles" })
export class NutritionServingProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", name: "food_id" })
  foodId!: string;

  @ManyToOne(() => NutritionFood, (food) => food.servings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "food_id" })
  food?: NutritionFood;

  @Column({ type: "varchar", name: "unit", length: 32 })
  unit!: string;

  @Column({ type: "numeric", name: "amount", precision: 10, scale: 2, default: 1 })
  amount!: string;

  @Column({ type: "numeric", name: "grams_equivalent", precision: 10, scale: 2 })
  gramsEquivalent!: string;

  @Column({ type: "boolean", name: "is_default", default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
