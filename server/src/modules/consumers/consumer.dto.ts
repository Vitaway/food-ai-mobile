import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
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
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  sex?: string | null;

  @IsOptional()
  @IsNumber()
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  activityLevel?: string;

  @IsOptional()
  dietaryPreferences?: string[];

  @IsOptional()
  allergies?: string[];

  @IsOptional()
  @IsNumber()
  targetWeightKg?: number | null;

  @IsOptional()
  @IsString()
  goalPace?: string | null;

  @IsOptional()
  @IsNumber()
  mealsPerDay?: number | null;

  @IsOptional()
  @IsObject()
  macroTargets?: Record<string, number>;

  @IsOptional()
  @IsNumber()
  bmr?: number;

  @IsOptional()
  @IsNumber()
  tdee?: number;

  @IsOptional()
  @IsNumber()
  waterTargetMl?: number;

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
