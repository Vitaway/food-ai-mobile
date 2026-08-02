import { IsNumber, IsObject, IsOptional, IsString, MaxLength, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

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

/** Nested `data` object from IremboPay payment notifications. */
export class IremboWebhookDataDto {
  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsObject()
  customer?: Record<string, unknown>;

  @IsOptional()
  paymentItems?: unknown;

  @IsOptional()
  @IsString()
  paymentAccountIdentifier?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;
}

/**
 * IremboPay callback body (`{ success, data: { ... } }`).
 * Also accepts the legacy stub `{ externalRef, status }` for local tests.
 */
export class IremboWebhookDto {
  @IsOptional()
  success?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => IremboWebhookDataDto)
  data?: IremboWebhookDataDto;

  /** Legacy / flat fields */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  externalRef?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  transactionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(24)
  status?: "pending" | "succeeded" | "failed" | "cancelled" | "refunded";

  @IsOptional()
  payload?: Record<string, unknown>;
}
