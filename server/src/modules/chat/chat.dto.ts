import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class SendChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  mealId?: string;
}

export class EnsurePatientConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientId?: string;

  @IsOptional()
  @IsUUID()
  coachUserId?: string;
}

export class EnsureDirectConversationDto {
  @IsUUID()
  userId!: string;
}
