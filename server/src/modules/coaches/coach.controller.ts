import {
  Authorized,
  BadRequestError,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  CurrentUser,
  QueryParam,
  Req,
  UseBefore,
} from "routing-controllers";
import type { Request } from "express";
import multer from "multer";
import type { User } from "../users/user.entity";
import {
  UpdateCoachProfileDto,
  ChangeCoachPasswordDto,
  SendCoachMessageDto,
  AssignClientDto,
  SaveClinicalAssessmentDto,
  ConfirmClinicalAssessmentDto,
} from "./coach.dto";
import { coachService } from "./coach.service";
import { coachMealsService } from "../meals/coach-meals.service";
import { coachAnalyticsService } from "../meals/coach-analytics.service";
import { smartAlertsService } from "./smart-alerts.service";
import { coachingFeedService } from "../consumers/coaching-feed.service";
import { CreateReviewTaskDto, ReviewMealDto, SaveReviewDraftDto } from "../meals/meals.dto";
import { platformMetricsService } from "../admin/platform-metrics.service";
import { clinicalAssessmentService } from "../consumers/clinical-assessment.service";

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller("/coach")
export class CoachController {
  @Authorized(["coach", "admin"])
  @Get("/profile")
  profile(@CurrentUser() user: User) {
    return coachService.getProfile(user.id);
  }

  @Authorized(["coach", "admin"])
  @Patch("/profile")
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateCoachProfileDto) {
    return coachService.updateProfile(user.id, dto);
  }

  @Authorized(["coach", "admin"])
  @Post("/profile/avatar")
  @UseBefore(avatarUpload.single("image"))
  async uploadAvatar(@CurrentUser() user: User, @Req() req: Request) {
    const file = req.file;
    if (!file) {
      throw new BadRequestError("Missing image file (field name: image)");
    }
    return coachService.uploadAvatar(user.id, file.buffer, file.mimetype, req);
  }

  @Authorized(["coach", "admin"])
  @Post("/password")
  changePassword(@CurrentUser() user: User, @Body() dto: ChangeCoachPasswordDto) {
    return coachMealsService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Authorized(["coach"])
  @Get("/stats")
  stats(@CurrentUser() user: User, @QueryParam("cohortId") cohortId?: string) {
    return coachMealsService.getStats(user.id, cohortId);
  }

  @Authorized(["coach"])
  @Get("/smart-alerts")
  smartAlerts(@CurrentUser() user: User) {
    return smartAlertsService.listForCoach(user.id);
  }

  @Authorized(["coach", "admin"])
  @Get("/analytics")
  analytics(@CurrentUser() user: User, @QueryParam("cohortId") cohortId?: string) {
    return coachAnalyticsService.getAnalytics(user.id, cohortId);
  }

  @Authorized(["coach"])
  @Get("/queue")
  queue(
    @CurrentUser() user: User,
    @QueryParam("search") search?: string,
    @QueryParam("sort") sort?: "oldest" | "newest" | "flagged" | "low_confidence" | "sla_urgency",
    @QueryParam("cohortId") cohortId?: string,
  ) {
    return coachMealsService.getQueue(user.id, { search, sort, cohortId });
  }

  @Authorized(["coach"])
  @Get("/reviews")
  pastReviews(
    @CurrentUser() user: User,
    @QueryParam("search") search?: string,
    @QueryParam("action") action?: "approve" | "reject",
    @QueryParam("limit") limit?: number,
  ) {
    return coachMealsService.getPastReviews(user.id, { search, action, limit });
  }

  @Authorized(["coach"])
  @Get("/clients")
  clients(@CurrentUser() user: User, @QueryParam("cohortId") cohortId?: string) {
    return coachMealsService.getClients(user.id, cohortId);
  }

  @Authorized(["coach"])
  @Get("/clients/:id")
  client(@CurrentUser() user: User, @Param("id") id: string) {
    return coachMealsService.getClientById(id, user.id);
  }

  @Authorized(["coach"])
  @Get("/clients/:id/clinical-assessment")
  clinicalAssessment(@CurrentUser() user: User, @Param("id") id: string) {
    return clinicalAssessmentService.get(id, user.id);
  }

  @Authorized(["coach"])
  @Patch("/clients/:id/clinical-assessment")
  saveClinicalAssessment(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: SaveClinicalAssessmentDto,
  ) {
    return clinicalAssessmentService.saveDraft(id, user.id, dto);
  }

  @Authorized(["coach"])
  @Post("/clients/:id/clinical-assessment/confirm")
  confirmClinicalAssessment(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: ConfirmClinicalAssessmentDto,
  ) {
    return clinicalAssessmentService.confirm(id, user.id, dto);
  }

  @Authorized(["coach"])
  @Get("/clients/:id/summary")
  clientSummary(@CurrentUser() user: User, @Param("id") id: string) {
    return coachMealsService.getClientWeeklySummary(id, user.id);
  }

  @Authorized(["coach"])
  @Get("/clients/:id/coaching-insights")
  async clientCoachingInsights(@CurrentUser() user: User, @Param("id") id: string) {
    await coachMealsService.getClientById(id, user.id);
    return coachingFeedService.listForCoachClient(id);
  }

  @Authorized(["coach"])
  @Post("/assignments")
  assignClient(@CurrentUser() user: User, @Body() dto: AssignClientDto) {
    return coachMealsService.assignClient(user.id, dto.clientId, user.id);
  }

  @Authorized(["coach"])
  @Delete("/assignments/:clientId")
  unassignClient(@CurrentUser() user: User, @Param("clientId") clientId: string) {
    return coachMealsService.unassignClient(user.id, clientId);
  }

  @Authorized(["coach"])
  @Get("/cohorts")
  cohorts(@CurrentUser() user: User) {
    return coachMealsService.getCohorts(user.id);
  }

  @Authorized(["coach"])
  @Get("/team")
  team(@CurrentUser() user: User) {
    return coachMealsService.getTeamStats(user.id);
  }

  @Authorized(["coach"])
  @Get("/messages/:clientId")
  messages(@CurrentUser() user: User, @Param("clientId") clientId: string) {
    return coachMealsService.getMessages(user.id, clientId);
  }

  @Authorized(["coach"])
  @Post("/messages/:clientId")
  sendMessage(
    @CurrentUser() user: User,
    @Param("clientId") clientId: string,
    @Body() dto: SendCoachMessageDto,
  ) {
    return coachMealsService.sendMessage(user.id, clientId, dto.body, dto.mealId);
  }

  @Authorized(["coach"])
  @Get("/operations")
  operations(@CurrentUser() user: User) {
    return platformMetricsService.getCoachOperations(user.id);
  }

  @Authorized(["coach"])
  @Get("/meals/:id")
  async meal(@CurrentUser() user: User, @Param("id") id: string) {
    return coachMealsService.getMealById(id, user.id);
  }

  @Authorized(["coach"])
  @Get("/meals/:id/review-draft")
  reviewDraft(@CurrentUser() user: User, @Param("id") id: string) {
    return coachMealsService.getReviewDraft(id, user.id);
  }

  @Authorized(["coach"])
  @Post("/meals/:id/review-draft")
  saveReviewDraft(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: SaveReviewDraftDto,
  ) {
    return coachMealsService.saveReviewDraft(id, user.id, dto);
  }

  @Authorized(["coach"])
  @Get("/meals/:id/review-tasks")
  reviewTasks(@CurrentUser() user: User, @Param("id") id: string) {
    return coachMealsService.listReviewTasks(id, user.id);
  }

  @Authorized(["coach"])
  @Post("/meals/:id/review-tasks")
  createReviewTask(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: CreateReviewTaskDto,
  ) {
    return coachMealsService.createReviewTask(id, user.id, dto);
  }

  @Authorized(["coach"])
  @Post("/meals/:id/review")
  review(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: ReviewMealDto,
  ) {
    return coachMealsService.reviewMeal(id, user.id, dto);
  }
}
