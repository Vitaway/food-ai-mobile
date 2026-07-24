import { IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class AnalyzeMealTextDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  text!: string;

  @IsOptional()
  @IsNumber()
  plateDiameterCm?: number | null;
}

export class SuggestMealTitleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  description?: string;

  /** Alias for description — clients may send either field. */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  text?: string;
}
