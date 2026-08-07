import {
  Authorized,
  BadRequestError,
  Body,
  Controller,
  CurrentUser,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  QueryParam,
  Req,
  Res,
  UseBefore,
} from "routing-controllers";
import type { Request, Response } from "express";
import multer from "multer";
import type { User } from "../users/user.entity";
import { UpdateConsumerProfileDto, SubmitConsumerMealDto, LogWaterDto, AccountDeletionRequestDto } from "./consumer.dto";
import { consumerService } from "./consumer.service";
import { paymentsService } from "../payments/payments.service";
import { reportsService } from "../reports/reports.service";
import type { ReportPeriod } from "../reports/report-snapshot.entity";
import { familySubscriptionService } from "../payments/family.service";
import { coachingFeedService } from "./coaching-feed.service";
import { accountLifecycleService } from "./account-lifecycle.service";
import { coachInsightsService } from "../coaches/coach-insights.service";
import {
  assertConsumerSubscription,
  getConsumerSubscriptionAccess,
} from "../../middlewares/entitlements";

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller("/consumer")
export class ConsumerController {
  @Authorized(["consumer"])
  @Get("/profile")
  profile(@CurrentUser() user: User) {
    return consumerService.getProfile(user.id);
  }

  @Authorized(["consumer"])
  @Patch("/profile")
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateConsumerProfileDto) {
    return consumerService.updateProfile(user.id, dto);
  }

  @Authorized(["consumer"])
  @Post("/profile/avatar")
  @UseBefore(avatarUpload.single("image"))
  async uploadAvatar(@CurrentUser() user: User, @Req() req: Request) {
    const file = req.file;
    if (!file) {
      throw new BadRequestError("Missing image file (field name: image)");
    }
    return consumerService.uploadAvatar(user.id, file.buffer, file.mimetype, req);
  }

  @Authorized(["consumer"])
  @Get("/dashboard")
  dashboard(@CurrentUser() user: User, @QueryParam("date") date?: string) {
    return consumerService.getDashboard(user.id, date);
  }

  @Authorized(["consumer"])
  @Get("/meals")
  meals(@CurrentUser() user: User) {
    return consumerService.listMeals(user.id);
  }

  @Authorized(["consumer"])
  @Post("/meals")
  submitMeal(@CurrentUser() user: User, @Body() dto: SubmitConsumerMealDto) {
    return consumerService.submitMeal(user.id, dto);
  }

  @Authorized(["consumer"])
  @Post("/meals/with-photo")
  @UseBefore(avatarUpload.single("image"))
  async submitMealWithPhoto(@CurrentUser() user: User, @Req() req: Request) {
    const raw = req.body?.meal;
    if (!raw || typeof raw !== "string") {
      throw new BadRequestError("Missing meal payload (field name: meal)");
    }

    let dto: SubmitConsumerMealDto;
    try {
      dto = JSON.parse(raw) as SubmitConsumerMealDto;
    } catch {
      throw new BadRequestError("Invalid meal JSON");
    }

    return consumerService.submitMeal(
      user.id,
      dto,
      req.file?.buffer,
      req.file?.mimetype,
      req,
    );
  }

  @Authorized(["consumer"])
  @Get("/meals/:id")
  meal(@CurrentUser() user: User, @Param("id") id: string) {
    return consumerService.getMeal(user.id, id);
  }

  @Authorized(["consumer"])
  @Post("/meals/:id/photo")
  @UseBefore(avatarUpload.single("image"))
  async uploadMealPhoto(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const file = req.file;
    if (!file) {
      throw new BadRequestError("Missing image file (field name: image)");
    }
    return consumerService.uploadMealPhoto(user.id, id, file.buffer, file.mimetype, req);
  }

  @Authorized(["consumer"])
  @Post("/water")
  logWater(@CurrentUser() user: User, @Body() dto: LogWaterDto) {
    return consumerService.logWater(user.id, dto);
  }

  @Authorized(["consumer"])
  @Get("/referral")
  referral(@CurrentUser() user: User) {
    return consumerService.getReferral(user.id);
  }

  @Authorized(["consumer"])
  @Get("/subscription")
  subscription(@CurrentUser() user: User) {
    return paymentsService.getMySubscription(user.id);
  }

  /** Used by mobile AuthGuard; mirrors product entitlement check (incl. family). */
  @Authorized(["consumer"])
  @Get("/subscription/access")
  subscriptionAccess(@CurrentUser() user: User) {
    return getConsumerSubscriptionAccess(user.id);
  }

  @Authorized(["consumer"])
  @Get("/payments")
  myPayments(@CurrentUser() user: User) {
    return paymentsService.listMyPayments(user.id);
  }

  @Authorized(["consumer"])
  @Get("/payments/:id/receipt")
  async paymentReceipt(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const { filename, buffer } = await paymentsService.getReceiptPdfForUser(user.id, id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
    return res;
  }

  @Authorized(["consumer"])
  @Get("/reports")
  async reports(@CurrentUser() user: User) {
    await assertConsumerSubscription(user.id);
    const profile = await consumerService.requireProfileForUser(user.id);
    return reportsService.listForConsumer(profile.id);
  }

  @Authorized(["consumer"])
  @Post("/reports/generate")
  async generateReport(
    @CurrentUser() user: User,
    @QueryParam("period") period?: ReportPeriod,
    @QueryParam("from") from?: string,
    @QueryParam("to") to?: string,
  ) {
    await assertConsumerSubscription(user.id);
    const profile = await consumerService.requireProfileForUser(user.id);
    const snapshot = await reportsService.generateConsumerSnapshot(profile.id, {
      period: from || to ? period ?? "custom" : period ?? "weekly",
      from,
      to,
    });
    if (!snapshot) {
      throw new BadRequestError("Unable to generate report");
    }
    return {
      id: snapshot.id,
      period: snapshot.period,
      periodStart: snapshot.periodStart,
      periodEnd: snapshot.periodEnd,
      metrics: snapshot.metrics,
      createdAt: snapshot.createdAt.toISOString(),
    };
  }

  @Authorized(["consumer"])
  @Get("/health-scores")
  healthScores(@CurrentUser() user: User, @QueryParam("days") days?: number) {
    return consumerService.getHealthScoreHistory(user.id, days);
  }

  @Authorized(["consumer"])
  @Get("/coaching-feed")
  async coachingFeed(@CurrentUser() user: User) {
    await assertConsumerSubscription(user.id);
    return coachingFeedService.listForConsumerUser(user.id);
  }

  /** Coach-authored insights only (no auto-generated tips). */
  @Authorized(["consumer"])
  @Get("/coach-insights")
  async coachInsights(@CurrentUser() user: User) {
    await assertConsumerSubscription(user.id);
    return coachInsightsService.listForConsumerUser(user.id);
  }

  @Authorized(["consumer"])
  @Get("/subscription/family")
  familySubscription(@CurrentUser() user: User) {
    return familySubscriptionService.getFamilySubscription(user.id);
  }

  @Authorized(["consumer"])
  @Post("/subscription/family/members")
  addFamilyMember(@CurrentUser() user: User, @Body() body: { email: string }) {
    return familySubscriptionService.addFamilyMember(user.id, body.email);
  }

  @Authorized(["consumer"])
  @Get("/data-export")
  exportData(@CurrentUser() user: User) {
    return accountLifecycleService.exportForUser(user.id);
  }

  /** Public; used by https://mirafood.vitaway.org/delete-account (Play Store). */
  @Post("/account/deletion-request")
  requestAccountDeletion(@Body() dto: AccountDeletionRequestDto) {
    return accountLifecycleService.requestDeletionFromWeb(dto);
  }

  @Authorized(["consumer"])
  @Delete("/account")
  deleteAccount(@CurrentUser() user: User) {
    return accountLifecycleService.deleteForUser(user.id);
  }
}
