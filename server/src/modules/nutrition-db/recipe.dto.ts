import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { UpsertNutritionServingDto } from "./nutrition-db.dto";

export class RecipeIngredientDto {
  @IsString()
  ingredientFoodId!: string;

  @IsNumber()
  @Min(0.01)
  rawWeightG!: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  variantGroup?: string;

  @IsOptional()
  @IsBoolean()
  isVariantDefault?: boolean;
}

export class CreateRecipeDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  nameRw?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsNumber()
  @Min(0.01)
  cookedYieldG!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  cookingMethod?: string;

  @IsOptional()
  @IsBoolean()
  asDraft?: boolean;

  @IsOptional()
  @IsBoolean()
  submitForReview?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients!: RecipeIngredientDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertNutritionServingDto)
  servings?: UpsertNutritionServingDto[];
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  nameRw?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  cookedYieldG?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  cookingMethod?: string;

  @IsOptional()
  @IsBoolean()
  asDraft?: boolean;

  @IsOptional()
  @IsBoolean()
  submitForReview?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients?: RecipeIngredientDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertNutritionServingDto)
  servings?: UpsertNutritionServingDto[];
}

export class PreviewRecipeDto {
  @IsNumber()
  @Min(0.01)
  cookedYieldG!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients!: RecipeIngredientDto[];

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  servingWeightG?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  cookingMethod?: string;
}
