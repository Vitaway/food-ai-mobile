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

  /** Optional teammate to assign / DM (coach or admin user id). */
  @IsOptional()
  @IsString()
  assigneeUserId?: string;

  /**
   * Where to notify:
   * - team: organization team chat only
   * - assignee: direct message to assigneeUserId
   * - both: DM assignee and post to team chat
   */
  @IsOptional()
  @IsIn(["team", "assignee", "both"])
  notifyChannel?: "team" | "assignee" | "both";
}
