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
}
