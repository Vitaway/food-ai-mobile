import {
  Authorized,
  BadRequestError,
  Body,
  Controller,
  CurrentUser,
  Post,
  Req,
  UseBefore,
} from "routing-controllers";
import type { Request } from "express";
import multer from "multer";
import type { User } from "../users/user.entity";
import { AnalyzeMealTextDto, SuggestMealTitleDto } from "./vision.dto";
import { visionService } from "./vision.service";
import { assertConsumerSubscription } from "../../middlewares/entitlements";
import { attachMealHonesty } from "../meals/meal-honesty.util";
import { asDetectedItems } from "../meals/nutrition.util";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

/**
 * Patient estimate analysis (provisional macros + pins).
 * Coach confirmation still happens after submit.
 */
@Controller("/vision")
export class VisionController {
  @Authorized(["consumer"])
  @Post("/meals/analyze")
  @UseBefore(upload.single("image"))
  async analyzeMealImage(@CurrentUser() user: User, @Req() req: Request) {
    await assertConsumerSubscription(user.id);
    const file = req.file;
    if (!file) {
      throw new BadRequestError("Missing image file (field name: image)");
    }
    const metadata = typeof req.body?.metadata === "string" ? req.body.metadata : "{}";
    const note = typeof req.body?.note === "string" ? req.body.note : null;
    const mealType = typeof req.body?.mealType === "string" ? req.body.mealType : null;

    const analysis = await visionService.analyzeMealFromImage(file.buffer, file.mimetype, {
      note,
      metadataRaw: metadata,
    });

    const honesty = attachMealHonesty({
      items: asDetectedItems(analysis.items),
      mealType,
      logSource: "photo",
      confirmed: false,
      totalCalories: analysis.totalNutrition.caloriesKcal,
    });

    return {
      ...analysis,
      items: honesty.items,
      logSource: "photo" as const,
      balancedPlate: honesty.balancedPlate,
      estimateRange: honesty.estimateRange,
    };
  }

  @Authorized(["consumer"])
  @Post("/meals/analyze-text")
  async analyzeMealText(@CurrentUser() user: User, @Body() dto: AnalyzeMealTextDto) {
    await assertConsumerSubscription(user.id);
    const analysis = await visionService.analyzeMealFromText(dto.text);
    const honesty = attachMealHonesty({
      items: asDetectedItems(analysis.items),
      logSource: "text",
      confirmed: false,
      totalCalories: analysis.totalNutrition.caloriesKcal,
    });

    return {
      ...analysis,
      items: honesty.items,
      logSource: "text" as const,
      balancedPlate: honesty.balancedPlate,
      estimateRange: honesty.estimateRange,
    };
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
