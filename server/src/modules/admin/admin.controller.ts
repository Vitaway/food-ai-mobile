import type { Request } from "express";
import {
  Authorized,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  CurrentUser,
  QueryParam,
} from "routing-controllers";
import type { User } from "../users/user.entity";
import { adminService } from "./admin.service";
import { platformMetricsService } from "./platform-metrics.service";
import { nutritionDbService } from "../nutrition-db/nutrition-db.service";
import {
  CreateCoachDto,
  CreateAdminUserDto,
  SetUserActiveDto,
  SetUserRoleDto,
  SetOrganizationModulesDto,
  EnsureOrganizationModulesDto,
  UpdateAdminUserDto,
  AdminResetPasswordDto,
  UpdateConsumerProfileAdminDto,
  UpdateCoachProfileAdminDto,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  SetClientCoachesDto,
} from "./admin.dto";
import { moduleEntitlementsService } from "./module-entitlements.service";
import { organizationsService } from "./organizations.service";
import { clinicalAssessmentService } from "../consumers/clinical-assessment.service";
import { adminPatientService } from "./admin-patient.service";
import { ConfirmClinicalAssessmentDto, SaveClinicalAssessmentDto } from "../coaches/coach.dto";

const ADMIN_OR_ORG = ["admin", "organization_admin"] as const;

@Controller("/admin")
export class AdminController {
  @Authorized([...ADMIN_OR_ORG])
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

  @Authorized([...ADMIN_OR_ORG])
  @Get("/coaches")
  listCoaches() {
    return adminService.listCoaches();
  }

  @Authorized([...ADMIN_OR_ORG])
  @Post("/coaches")
  createCoach(
    @CurrentUser() admin: User,
    @Body() dto: CreateCoachDto,
    @Req() req: Request,
  ) {
    return adminService.createCoach(admin.id, admin, dto, req);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Get("/consumers")
  listConsumers() {
    return adminService.listConsumers();
  }

  @Authorized([...ADMIN_OR_ORG])
  @Post("/users")
  createUser(
    @CurrentUser() admin: User,
    @Body() dto: CreateAdminUserDto,
    @Req() req: Request,
  ) {
    return adminService.createUser(admin.id, admin, dto, req);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Get("/users/:id")
  getUser(@CurrentUser() admin: User, @Param("id") id: string) {
    return adminService.getUserDetail(admin, id);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Patch("/users/:id")
  updateUser(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: UpdateAdminUserDto,
    @Req() req: Request,
  ) {
    return adminService.updateUser(admin.id, admin, id, dto, req);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Post("/users/:id/reset-password")
  resetUserPassword(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: AdminResetPasswordDto,
    @Req() req: Request,
  ) {
    return adminService.resetUserPassword(admin.id, admin, id, dto, req);
  }

  @Authorized(["admin"])
  @Delete("/users/:id")
  deleteUser(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    return adminService.deleteUser(admin.id, admin, id, req);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Patch("/users/:id/consumer-profile")
  updateConsumerProfile(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: UpdateConsumerProfileAdminDto,
    @Req() req: Request,
  ) {
    return adminService.updateConsumerProfile(admin.id, admin, id, dto, req);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Patch("/users/:id/coach-profile")
  updateCoachProfile(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: UpdateCoachProfileAdminDto,
    @Req() req: Request,
  ) {
    return adminService.updateCoachProfileAdmin(admin.id, admin, id, dto, req);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Get("/users/:id/patient")
  getPatientView(@CurrentUser() admin: User, @Param("id") id: string) {
    return adminPatientService.getPatientView(admin, id);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Put("/users/:id/coaches")
  setClientCoaches(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: SetClientCoachesDto,
  ) {
    return adminPatientService.setClientCoaches(admin, id, dto.coachUserIds);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Get("/users/:id/patient/summary")
  getPatientSummary(@CurrentUser() admin: User, @Param("id") id: string) {
    return adminPatientService.getWeeklySummary(admin, id);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Get("/users/:id/patient/coaching-insights")
  getPatientCoachingInsights(@CurrentUser() admin: User, @Param("id") id: string) {
    return adminPatientService.getCoachingInsights(admin, id);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Get("/users/:id/clinical-assessment")
  getClinicalAssessment(@CurrentUser() admin: User, @Param("id") id: string) {
    return adminPatientService.getClinicalAssessment(admin, id);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Patch("/users/:id/clinical-assessment")
  saveClinicalAssessment(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: SaveClinicalAssessmentDto,
  ) {
    return adminPatientService.saveClinicalAssessment(admin, id, admin.id, dto);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Post("/users/:id/clinical-assessment/confirm")
  confirmClinicalAssessment(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: ConfirmClinicalAssessmentDto,
  ) {
    return adminPatientService.confirmClinicalAssessment(admin, id, admin.id, dto);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Get("/users")
  listUsers(@CurrentUser() admin: User) {
    return adminService.listUsers(admin);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Patch("/users/:id/active")
  setUserActive(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: SetUserActiveDto,
    @Req() req: Request,
  ) {
    return adminService.setUserActive(admin.id, admin, id, dto, req);
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

  @Authorized([...ADMIN_OR_ORG])
  @Get("/referrals")
  referrals() {
    return adminService.referralStats();
  }

  @Authorized(["admin"])
  @Get("/analytics/growth")
  growth(@QueryParam("days") days?: number) {
    return adminService.growthSeries(days ?? 30);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Patch("/users/:id/role")
  setUserRole(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: SetUserRoleDto,
    @Req() req: Request,
  ) {
    return adminService.setUserRole(admin.id, admin, id, dto, req);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Get("/organizations")
  listOrganizations(@CurrentUser() admin: User) {
    return organizationsService.list(admin);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Get("/organizations/:id")
  getOrganization(@CurrentUser() admin: User, @Param("id") id: string) {
    return organizationsService.get(admin, id);
  }

  @Authorized(["admin"])
  @Post("/organizations")
  createOrganization(
    @CurrentUser() admin: User,
    @Body() dto: CreateOrganizationDto,
    @Req() req: Request,
  ) {
    return organizationsService.create(admin, dto, req);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Get("/organizations/:id/metrics")
  getOrganizationMetrics(@CurrentUser() admin: User, @Param("id") id: string) {
    return organizationsService.metrics(admin, id);
  }

  @Authorized([...ADMIN_OR_ORG])
  @Post("/organizations/:id/reports/generate")
  generateOrganizationReport(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @QueryParam("period") period?: string,
    @QueryParam("from") from?: string,
    @QueryParam("to") to?: string,
  ) {
    return organizationsService.generateReport(admin, id, {
      period: from || to ? (period as "custom") ?? "custom" : (period as "weekly" | "monthly") ?? "weekly",
      from,
      to,
    });
  }

  @Authorized([...ADMIN_OR_ORG])
  @Patch("/organizations/:id")
  updateOrganization(
    @CurrentUser() admin: User,
    @Param("id") id: string,
    @Body() dto: UpdateOrganizationDto,
    @Req() req: Request,
  ) {
    return organizationsService.update(admin, id, dto, req);
  }

  @Authorized(["admin"])
  @Get("/modules/catalog")
  moduleCatalog() {
    return { catalog: moduleEntitlementsService.catalog() };
  }

  @Authorized([...ADMIN_OR_ORG])
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
