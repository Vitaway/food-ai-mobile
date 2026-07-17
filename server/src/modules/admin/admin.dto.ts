import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCoachDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MaxLength(255)
  displayName!: string;

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
}

export class SetUserActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

export class SetUserRoleDto {
  @IsString()
  @MaxLength(32)
  role!:
    | "consumer"
    | "coach"
    | "admin"
    | "data_entry_staff"
    | "organization_admin"
    | "nutrition_coach";
}

export class SetOrganizationModulesDto {
  @IsArray()
  @IsString({ each: true })
  modules!: string[];
}

export class EnsureOrganizationModulesDto {
  @IsString()
  @MaxLength(255)
  organizationKey!: string;
}
