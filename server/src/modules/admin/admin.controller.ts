import type { Request } from "express";
import {
  Authorized,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  CurrentUser,
} from "routing-controllers";
import type { User } from "../users/user.entity";
import { adminService } from "./admin.service";
import { CreateCoachDto, SetUserActiveDto } from "./admin.dto";

@Controller("/admin")
export class AdminController {
  @Authorized(["admin"])
  @Get("/metrics")
  metrics() {
    return adminService.metrics();
  }

  @Authorized(["admin"])
  @Get("/coaches")
  listCoaches() {
    return adminService.listCoaches();
  }

  @Authorized(["admin"])
  @Post("/coaches")
  createCoach(
    @CurrentUser() admin: User,
    @Body() dto: CreateCoachDto,
    @Req() req: Request,
  ) {
    return adminService.createCoach(admin.id, dto, req);
  }

  @Authorized(["admin"])
  @Get("/consumers")
  listConsumers() {
    return adminService.listConsumers();
  }

  @Authorized(["admin"])
  @Patch("/users/:id/active")
  setUserActive(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: SetUserActiveDto,
    @Req() req: Request,
  ) {
    return adminService.setUserActive(admin.id, id, dto, req);
  }

  @Authorized(["admin"])
  @Get("/system")
  systemStatus() {
    return adminService.systemStatus();
  }

  @Authorized(["admin"])
  @Get("/audit-logs")
  auditLogs() {
    return adminService.auditLogs();
  }
}
