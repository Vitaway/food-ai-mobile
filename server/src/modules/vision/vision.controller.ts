import { Authorized, BadRequestError, Body, Controller, Post } from "routing-controllers";
import { AnalyzeMealTextDto } from "./vision.dto";
import type { User } from "../users/user.entity";

/**
 * Patient-facing vision endpoints are disabled — meals go to coaches first.
 * Coach AI assist lives under /coach/meals/:id/ai-assist.
 */
@Controller("/vision")
export class VisionController {
  @Authorized(["consumer"])
  @Post("/plates/detect")
  async detectPlate() {
    throw new BadRequestError(
      "Plate detection is no longer available on the patient app. Submit meals for coach review.",
    );
  }

  @Authorized(["consumer"])
  @Post("/meals/analyze")
  async analyzeMealImage() {
    throw new BadRequestError(
      "Meal analysis is coach-only. Submit the meal photo for coach review.",
    );
  }

  @Authorized(["consumer"])
  @Post("/meals/analyze-text")
  async analyzeMealText(@Body() _dto: AnalyzeMealTextDto) {
    throw new BadRequestError(
      "Meal analysis is coach-only. Submit a description for coach review.",
    );
  }
}
