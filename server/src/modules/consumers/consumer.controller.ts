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
  UseBefore,
} from "routing-controllers";
import type { Request } from "express";
import multer from "multer";
import type { User } from "../users/user.entity";
import { UpdateConsumerProfileDto, SubmitConsumerMealDto, LogWaterDto } from "./consumer.dto";
import { consumerService } from "./consumer.service";
import { paymentsService } from "../payments/payments.service";
import { reportsService } from "../reports/reports.service";
import { familySubscriptionService } from "../payments/family.service";
import { coachingFeedService } from "./coaching-feed.service";
import { accountLifecycleService } from "./account-lifecycle.service";

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

  @Authorized(["consumer"])
  @Get("/reports")
  async reports(@CurrentUser() user: User) {
    const profile = await consumerService.requireProfileForUser(user.id);
    return reportsService.listForConsumer(profile.id);
  }

  @Authorized(["consumer"])
  @Get("/health-scores")
  healthScores(@CurrentUser() user: User, @QueryParam("days") days?: number) {
    return consumerService.getHealthScoreHistory(user.id, days);
  }

  @Authorized(["consumer"])
  @Get("/coaching-feed")
  coachingFeed(@CurrentUser() user: User) {
    return coachingFeedService.listForConsumerUser(user.id);
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

  @Authorized(["consumer"])
  @Delete("/account")
  deleteAccount(@CurrentUser() user: User) {
    return accountLifecycleService.deleteForUser(user.id);
  }
}
