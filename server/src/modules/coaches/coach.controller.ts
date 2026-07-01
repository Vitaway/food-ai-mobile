import {
  Authorized,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  CurrentUser,
} from "routing-controllers";
import type { User } from "../users/user.entity";
import { UpdateCoachProfileDto } from "./coach.dto";
import { coachService } from "./coach.service";
import { coachMealsService } from "../meals/coach-meals.service";
import { coachAnalyticsService } from "../meals/coach-analytics.service";
import { ReviewMealDto } from "../meals/meals.dto";

@Controller("/coach")
export class CoachController {
  @Authorized(["coach"])
  @Get("/profile")
  profile(@CurrentUser() user: User) {
    return coachService.getProfile(user.id);
  }

  @Authorized(["coach"])
  @Patch("/profile")
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateCoachProfileDto) {
    return coachService.updateProfile(user.id, dto);
  }

  @Authorized(["coach"])
  @Get("/stats")
  stats() {
    return coachMealsService.getStats();
  }

  @Authorized(["coach"])
  @Get("/analytics")
  analytics() {
    return coachAnalyticsService.getAnalytics();
  }

  @Authorized(["coach"])
  @Get("/queue")
  queue() {
    return coachMealsService.getQueue();
  }

  @Authorized(["coach"])
  @Get("/clients")
  clients() {
    return coachMealsService.getClients();
  }

  @Authorized(["coach"])
  @Get("/meals/:id")
  async meal(@Param("id") id: string) {
    return coachMealsService.getMealById(id);
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
