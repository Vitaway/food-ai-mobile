import {
  IsArray,
  IsBoolean,
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
  MinLength,
} from "class-validator";

export class UpdateCoachProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  organization?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarUrl?: string;
}

export class ChangeCoachPasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class SendCoachMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @IsOptional()
  @IsString()
  mealId?: string;
}

export class AssignClientDto {
  @IsString()
  clientId!: string;
}

export class SaveClinicalAssessmentDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  verifiedDateOfBirth?: string;

  /** @deprecated Legacy drafts only; new confirmations require date of birth. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  verifiedAge?: number;

  @IsOptional()
  @IsIn(["male", "female", "other", "prefer_not_to_say"])
  verifiedSex?: "male" | "female" | "other" | "prefer_not_to_say";

  @IsOptional()
  @IsNumber()
  @Min(45)
  @Max(250)
  verifiedHeightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(400)
  verifiedWeightKg?: number;

  @IsOptional()
  @IsBoolean()
  pregnant?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  trimester?: 1 | 2 | 3 | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  numberOfBabies?: 1 | 2 | null;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(400)
  prePregnancyWeightKg?: number | null;

  @IsOptional()
  @IsBoolean()
  lactating?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];

  @IsOptional()
  @IsObject()
  conditionDetails?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  fluidRestriction?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  occupation?: string;

  @IsOptional()
  @IsObject()
  exercise?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  smoking?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  alcohol?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  sleepHours?: number;

  @IsOptional()
  @IsIn(["low", "moderate", "high"])
  stressLevel?: "low" | "moderate" | "high";

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  coachNotes?: string;

  /** Coach may correct patient-submitted onboarding fields (stored on consumer profile). */
  @IsOptional()
  @IsIn(["lose_weight", "maintain_weight", "gain_muscle", "improve_quality"])
  goal?: string;

  @IsOptional()
  @IsIn(["slow", "moderate", "aggressive"])
  goalPace?: "slow" | "moderate" | "aggressive";

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(400)
  targetWeightKg?: number | null;

  @IsOptional()
  @IsIn([
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extremely_active",
  ])
  activityLevel?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  mealsPerDay?: number | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryPreferences?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];
}

export class ConfirmClinicalAssessmentDto {
  @IsOptional()
  @IsBoolean()
  allowProtectedWeightLoss?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  confirmationNote?: string;
}
