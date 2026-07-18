import { IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateCheckoutDto {
  @IsString()
  @MaxLength(64)
  planCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  organizationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  organizationName?: string;

  /** @deprecated Ignored — server plan catalog owns pricing. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  /** @deprecated Ignored — server plan catalog owns currency. */
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  /** @deprecated Ignored — derived from planCode. */
  @IsOptional()
  @IsString()
  @MaxLength(24)
  subscriptionType?: "individual" | "corporate" | "family";
}

export class IremboWebhookDto {
  @IsString()
  @MaxLength(128)
  externalRef!: string;

  @IsString()
  @MaxLength(24)
  status!: "pending" | "succeeded" | "failed" | "cancelled" | "refunded";

  @IsOptional()
  payload?: Record<string, unknown>;
}
