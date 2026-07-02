import {
  Authorized,
  Body,
  Controller,
  CurrentUser,
  Post,
  Req,
} from "routing-controllers";
import type { Request } from "express";
import { authService } from "./auth.service";
import { LoginDto, RegisterDto } from "./auth.dto";
import type { User } from "../users/user.entity";

@Controller("/auth")
export class AuthController {
  @Post("/register")
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return authService.register(dto, req);
  }

  @Post("/login")
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return authService.login(dto, req);
  }

  @Authorized()
  @Post("/logout")
  async logout(@Req() req: Request) {
    const payload = (req as Request & { authPayload?: { sid: string } }).authPayload;
    if (payload?.sid) {
      await authService.logout(payload.sid);
    }
    return { ok: true };
  }

  @Authorized()
  @Post("/me")
  me(@CurrentUser() user: User) {
    return authService.me(user.id);
  }
}
