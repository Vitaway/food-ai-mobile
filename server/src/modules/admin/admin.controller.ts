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
  QueryParam,
} from "routing-controllers";
import type { User } from "../users/user.entity";
import { adminService } from "./admin.service";
import { platformMetricsService } from "./platform-metrics.service";
import { nutritionDbService } from "../nutrition-db/nutrition-db.service";
import { CreateCoachDto, SetUserActiveDto, SetUserRoleDto, SetOrganizationModulesDto, EnsureOrganizationModulesDto } from "./admin.dto";
import { moduleEntitlementsService } from "./module-entitlements.service";
import { clinicalAssessmentService } from "../consumers/clinical-assessment.service";

@Controller("/admin")
export class AdminController {
  @Authorized(["admin"])
  @Get("/metrics")
  metrics() {
    return adminService.metrics();
  }

  @Authorized(["admin"])
  @Get("/metrics/operations")
  operationsMetrics() {
    return platformMetricsService.getAdminOperations();
  }

  @Authorized(["admin"])
  @Get("/coaches/roster")
  coachRoster() {
    return platformMetricsService.getCoachRoster();
  }

  @Authorized(["admin"])
  @Get("/nutrition-db/pending")
  pendingNutritionFoods() {
    return nutritionDbService.listPendingFoods();
  }

  @Authorized(["admin"])
  @Post("/nutrition-db/foods/:id/approve")
  approveNutritionFood(@CurrentUser() admin: User, @Param("id") id: string) {
    return nutritionDbService.approveFood(id, admin.id);
  }

  @Authorized(["admin"])
  @Post("/nutrition-db/foods/:id/reject")
  rejectNutritionFood(@CurrentUser() admin: User, @Param("id") id: string) {
    return nutritionDbService.rejectFood(id, admin.id);
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
  @Get("/users")
  listUsers() {
    return adminService.listUsers();
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

  @Authorized(["admin"])
  @Get("/referrals")
  referrals() {
    return adminService.referralStats();
  }

  @Authorized(["admin"])
  @Get("/analytics/growth")
  growth(@QueryParam("days") days?: number) {
    return adminService.growthSeries(days ?? 30);
  }

  @Authorized(["admin"])
  @Patch("/users/:id/role")
  setUserRole(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: SetUserRoleDto,
    @Req() req: Request,
  ) {
    return adminService.setUserRole(admin.id, id, dto, req);
  }

  @Authorized(["admin"])
  @Get("/modules/catalog")
  moduleCatalog() {
    return { catalog: moduleEntitlementsService.catalog() };
  }

  @Authorized(["admin"])
  @Get("/clinical-assessments")
  clinicalAssessments() {
    return clinicalAssessmentService.listWorkflow();
  }

  @Authorized(["admin"])
  @Get("/modules/entitlements")
  listModuleEntitlements() {
    return moduleEntitlementsService.listAccounts();
  }

  @Authorized(["admin"])
  @Get("/modules/entitlements/:organizationKey")
  getModuleEntitlements(@Param("organizationKey") organizationKey: string) {
    return moduleEntitlementsService.getOrganization(decodeURIComponent(organizationKey));
  }

  @Authorized(["admin"])
  @Patch("/modules/entitlements/:organizationKey")
  setModuleEntitlements(
    @CurrentUser() admin: User,
    @Param("organizationKey") organizationKey: string,
    @Body() dto: SetOrganizationModulesDto,
    @Req() req: Request,
  ) {
    return moduleEntitlementsService.setOrganizationModules(
      admin.id,
      decodeURIComponent(organizationKey),
      dto.modules ?? [],
      req,
    );
  }

  @Authorized(["admin"])
  @Post("/modules/entitlements")
  ensureModuleAccount(
    @CurrentUser() admin: User,
    @Body() dto: EnsureOrganizationModulesDto,
    @Req() req: Request,
  ) {
    return moduleEntitlementsService.ensureAccount(admin.id, dto.organizationKey, req);
  }
}
