import {
  IsBoolean,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
} from "class-validator";

export class UpdateConsumerProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string | null;

  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(["male", "female", "other", "prefer_not_to_say", null])
  sex?: "male" | "female" | "other" | "prefer_not_to_say" | null;

  @IsOptional()
  @IsNumber()
  @Min(80)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(400)
  weightKg?: number;

  @IsOptional()
  @IsIn([
    "lose_weight",
    "maintain_weight",
    "maintain",
    "gain_muscle",
    "improve_quality",
    "improve_diet_quality",
  ])
  goal?:
    | "lose_weight"
    | "maintain_weight"
    | "maintain"
    | "gain_muscle"
    | "improve_quality"
    | "improve_diet_quality";

  @IsOptional()
  @IsIn([
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extremely_active",
  ])
  activityLevel?:
    | "sedentary"
    | "lightly_active"
    | "moderately_active"
    | "very_active"
    | "extremely_active";

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryPreferences?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(400)
  targetWeightKg?: number | null;

  @IsOptional()
  @IsIn(["slow", "moderate", "aggressive", null])
  goalPace?: "slow" | "moderate" | "aggressive" | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  mealsPerDay?: number | null;

  /** @deprecated Server-calculated; accepted only for older clients and ignored. */
  @IsOptional()
  @IsObject()
  macroTargets?: Record<string, number>;

  /** @deprecated Server-calculated; accepted only for older clients and ignored. */
  @IsOptional()
  @IsNumber()
  bmr?: number;

  /** @deprecated Server-calculated; accepted only for older clients and ignored. */
  @IsOptional()
  @IsNumber()
  tdee?: number;

  /** @deprecated Server-calculated; accepted only for older clients and ignored. */
  @IsOptional()
  @IsNumber()
  waterTargetMl?: number;

  /** @deprecated Server-derived; accepted only for older clients and ignored. */
  @IsOptional()
  @IsBoolean()
  onboardingComplete?: boolean;
}

export class SubmitConsumerMealDto {
  @IsString()
  @MaxLength(64)
  id!: string;

  @IsString()
  @MaxLength(32)
  mealType!: string;

  @IsString()
  @MaxLength(32)
  status!: string;

  @IsString()
  submittedAt!: string;

  @IsObject()
  data!: Record<string, unknown>;
}

export class LogWaterDto {
  @IsNumber()
  amountMl!: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  date?: string;
}
