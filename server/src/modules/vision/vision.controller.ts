import {
  Authorized,
  BadRequestError,
  Body,
  Controller,
  CurrentUser,
  Post,
} from "routing-controllers";
import type { User } from "../users/user.entity";
import { AnalyzeMealTextDto, SuggestMealTitleDto } from "./vision.dto";
import { visionService } from "./vision.service";
import { assertConsumerSubscription } from "../../middlewares/entitlements";

/**
 * Full meal nutrition analysis is coach-only (/coach/meals/:id/ai-assist).
 * Patients may still request a lightweight dish title for the food log.
 */
@Controller("/vision")
export class VisionController {
  @Authorized(["consumer"])
  @Post("/plates/detect")
  async detectPlate(@CurrentUser() user: User) {
    await assertConsumerSubscription(user.id);
    throw new BadRequestError(
      "Plate detection is no longer available on the patient app. Submit meals for coach review.",
    );
  }

  @Authorized(["consumer"])
  @Post("/meals/analyze")
  async analyzeMealImage(@CurrentUser() user: User) {
    await assertConsumerSubscription(user.id);
    throw new BadRequestError(
      "Meal analysis is coach-only. Submit the meal photo for coach review.",
    );
  }

  @Authorized(["consumer"])
  @Post("/meals/analyze-text")
  async analyzeMealText(@CurrentUser() user: User, @Body() _dto: AnalyzeMealTextDto) {
    await assertConsumerSubscription(user.id);
    throw new BadRequestError(
      "Meal analysis is coach-only. Submit a description for coach review.",
    );
  }

  @Authorized(["consumer"])
  @Post("/meals/title")
  async suggestMealTitle(@CurrentUser() user: User, @Body() dto: SuggestMealTitleDto) {
    await assertConsumerSubscription(user.id);
    const description = dto.description?.trim() || dto.text?.trim();
    if (!description || description.length < 2) {
      throw new BadRequestError("description is required");
    }
    return visionService.suggestMealTitle(description);
  }
}
