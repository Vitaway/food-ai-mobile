import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  referralCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  registrationSource?: "individual" | "company" | "institution" | "referral";
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class VerifyResetCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: "Code must be a 6-digit number" })
  code!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: "Code must be a 6-digit number" })
  code!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class VerifyMfaDto {
  @IsString()
  @MinLength(20)
  challengeToken!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: "Code must be a 6-digit number" })
  code!: string;
}

