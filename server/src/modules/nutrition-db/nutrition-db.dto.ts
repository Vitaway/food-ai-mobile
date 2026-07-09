import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpsertNutritionServingDto {
  @IsString()
  @MaxLength(32)
  unit!: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsNumber()
  @Min(0.01)
  gramsEquivalent!: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateNutritionFoodDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @MaxLength(80)
  category!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  brand?: string;

  @IsOptional()
  @IsObject()
  nutritionPer100g?: Record<string, number>;

  @IsOptional()
  @IsObject()
  micronutrients?: Record<string, number>;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string;

  @IsOptional()
  @IsArray()
  servings?: UpsertNutritionServingDto[];
}

export class UpdateNutritionFoodDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  brand?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  nutritionPer100g?: Record<string, number>;

  @IsOptional()
  @IsObject()
  micronutrients?: Record<string, number>;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string;

  @IsOptional()
  @IsArray()
  servings?: UpsertNutritionServingDto[];
}
