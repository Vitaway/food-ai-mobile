import { IsIn, IsOptional, IsString } from "class-validator";

export class ReviewMealDto {
  @IsIn(["approve", "reject"])
  action!: "approve" | "reject";

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  mealName?: string;

  @IsOptional()
  items?: unknown[];

  @IsOptional()
  @IsString()
  trainingNote?: string;
}

export class SaveReviewDraftDto {
  @IsOptional()
  @IsString()
  mealName?: string;

  @IsOptional()
  items?: unknown[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  trainingNote?: string;
}

export class CreateReviewTaskDto {
  @IsIn(["second_opinion", "escalation"])
  type!: "second_opinion" | "escalation";

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  notifyUser?: boolean;
}
