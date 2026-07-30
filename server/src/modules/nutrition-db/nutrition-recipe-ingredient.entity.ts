import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { NutritionFood } from "./nutrition-food.entity";

@Entity({ name: "nutrition_recipe_ingredients" })
export class NutritionRecipeIngredient {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** The dish / recipe food row. */
  @Index()
  @Column({ type: "uuid", name: "recipe_food_id" })
  recipeFoodId!: string;

  @ManyToOne(() => NutritionFood, { onDelete: "CASCADE" })
  @JoinColumn({ name: "recipe_food_id" })
  recipeFood?: NutritionFood;

  /** Ingredient from the nutrition database. */
  @Index()
  @Column({ type: "uuid", name: "ingredient_food_id" })
  ingredientFoodId!: string;

  @ManyToOne(() => NutritionFood, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "ingredient_food_id" })
  ingredientFood?: NutritionFood;

  /** Raw (uncooked) weight in grams. */
  @Column({ type: "numeric", name: "raw_weight_g", precision: 10, scale: 2 })
  rawWeightG!: string;

  @Column({ type: "int", name: "sort_order", default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
