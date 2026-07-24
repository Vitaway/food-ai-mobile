import { Authorized, BadRequestError, Body, Controller, Post } from "routing-controllers";
import { AnalyzeMealTextDto, SuggestMealTitleDto } from "./vision.dto";
import { visionService } from "./vision.service";

/**
 * Full meal nutrition analysis is coach-only (/coach/meals/:id/ai-assist).
 * Patients may still request a lightweight dish title for the food log.
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

  @Authorized(["consumer"])
  @Post("/meals/title")
  async suggestMealTitle(@Body() dto: SuggestMealTitleDto) {
    const description = dto.description?.trim() || dto.text?.trim();
    if (!description || description.length < 2) {
      throw new BadRequestError("description is required");
    }
    return visionService.suggestMealTitle(description);
  }
}
