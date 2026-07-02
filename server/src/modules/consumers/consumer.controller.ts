import {
  Authorized,
  Body,
  Controller,
  CurrentUser,
  Get,
  Param,
  Patch,
  Post,
} from "routing-controllers";
import type { User } from "../users/user.entity";
import { UpdateConsumerProfileDto, SubmitConsumerMealDto, LogWaterDto } from "./consumer.dto";
import { consumerService } from "./consumer.service";

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
  @Get("/dashboard")
  dashboard(@CurrentUser() user: User) {
    return consumerService.getDashboard(user.id);
  }

  @Authorized(["consumer"])
  @Get("/meals")
  meals(@CurrentUser() user: User) {
    return consumerService.listMeals(user.id);
  }

  @Authorized(["consumer"])
  @Get("/meals/:id")
  meal(@CurrentUser() user: User, @Param("id") id: string) {
    return consumerService.getMeal(user.id, id);
  }

  @Authorized(["consumer"])
  @Post("/meals")
  submitMeal(@CurrentUser() user: User, @Body() dto: SubmitConsumerMealDto) {
    return consumerService.submitMeal(user.id, dto);
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
}
