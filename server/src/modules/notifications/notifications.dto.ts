import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterPushTokenDto {
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  token!: string;

  @IsString()
  @IsIn(["ios", "android", "web"])
  platform!: "ios" | "android" | "web";
}

export class UnregisterPushTokenDto {
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  token!: string;
}
