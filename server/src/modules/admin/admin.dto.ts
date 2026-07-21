import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

const ADMIN_CREATABLE_ROLES = [
  "consumer",
  "coach",
  "nutrition_coach",
  "organization_admin",
  "data_entry_staff",
  "admin",
] as const;

const REGISTRATION_SOURCES = [
  "individual",
  "company",
  "institution",
  "referral",
  "admin_created",
] as const;

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

export class CreateAdminUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsString()
  @MaxLength(255)
  displayName!: string;

  @IsIn(ADMIN_CREATABLE_ROLES)
  role!: (typeof ADMIN_CREATABLE_ROLES)[number];

  @IsOptional()
  @IsIn(["standard", "pro"])
  membershipTier?: "standard" | "pro";

  @IsOptional()
  @IsIn(REGISTRATION_SOURCES)
  registrationSource?: (typeof REGISTRATION_SOURCES)[number];

  @IsOptional()
  @IsBoolean()
  sendInviteEmail?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  organizationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  goal?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];
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

  @IsOptional()
  @IsString()
  @MaxLength(255)
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  organizationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  role?:
    | "consumer"
    | "coach"
    | "admin"
    | "data_entry_staff"
    | "organization_admin"
    | "nutrition_coach";

  @IsOptional()
  @IsIn(["standard", "pro"])
  membershipTier?: "standard" | "pro";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  organizationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string | null;
}

export class AdminResetPasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}

export class UpdateConsumerProfileAdminDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  goal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  goalPace?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateCoachProfileAdminDto {
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

export class CreateOrganizationDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  status?: "active" | "inactive";

  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}

export class SetClientCoachesDto {
  @IsArray()
  @IsString({ each: true })
  coachUserIds!: string[];
}
