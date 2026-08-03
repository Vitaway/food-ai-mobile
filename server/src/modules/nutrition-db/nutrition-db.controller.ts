import {
  Authorized,
  BadRequestError,
  Body,
  Controller,
  CurrentUser,
  Get,
  Param,
  Patch,
  Post,
  QueryParam,
  Req,
  UseBefore,
} from "routing-controllers";
import type { Request } from "express";
import type { User } from "../users/user.entity";
import multer from "multer";
import { CreateNutritionFoodDto, UpdateNutritionFoodDto } from "./nutrition-db.dto";
import { CreateRecipeDto, PreviewRecipeDto, UpdateRecipeDto } from "./recipe.dto";
import { nutritionDbService } from "./nutrition-db.service";
import { recipeService } from "./recipe.service";
import { parseCsvQueryParam } from "./query-param.util";
import { saveNutritionFoodImage } from "../../services/uploads.service";

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller("/nutrition-db")
export class NutritionDbController {
  @Authorized(["coach", "admin", "data_entry_staff"])
  @Get("/review-queue")
  reviewQueue() {
    return recipeService.reviewQueue();
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Get("/recipes")
  listRecipes(@QueryParam("q") q?: string) {
    return recipeService.listRecipes(q, "all");
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Post("/recipes/preview")
  previewRecipe(@Body() dto: PreviewRecipeDto) {
    return recipeService.preview(dto);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Get("/recipes/:id")
  getRecipe(@Param("id") id: string) {
    return recipeService.getRecipe(id);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Post("/recipes")
  createRecipe(@Body() dto: CreateRecipeDto, @CurrentUser() user: User) {
    const payload =
      user.role === "coach" && dto.asDraft !== true && dto.submitForReview !== true
        ? { ...dto, asDraft: true }
        : dto;
    return recipeService.createRecipe(payload, user.id);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Patch("/recipes/:id")
  updateRecipe(@Param("id") id: string, @Body() dto: UpdateRecipeDto) {
    return recipeService.updateRecipe(id, dto);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Post("/recipes/:id/submit")
  submitRecipe(@Param("id") id: string, @CurrentUser() user: User) {
    return recipeService.submitRecipe(id, user.id);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Post("/recipes/:id/return")
  returnRecipe(@Param("id") id: string) {
    return recipeService.returnRecipeToDraft(id);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Post("/recipes/:id/approve")
  approveRecipe(@Param("id") id: string, @CurrentUser() user: User) {
    return recipeService.approveRecipe(id, user.id);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Patch("/recipes/:id/archive")
  archiveRecipe(@Param("id") id: string) {
    return recipeService.archiveRecipe(id);
  }

  @Authorized(["coach", "admin", "data_entry_staff", "consumer"])
  @Get("/foods")
  foods(
    @QueryParam("q") q?: string,
    @QueryParam("category") category?: string,
    @QueryParam("includeInactive") includeInactive?: boolean,
    @QueryParam("approval") approval?: "approved" | "pending" | "rejected" | "draft" | "all",
    @QueryParam("page") page?: number,
    @QueryParam("pageSize") pageSize?: number,
    @QueryParam("sourceType") sourceType?: string,
    // Must stay typed as string; see parseCsvQueryParam.
    @QueryParam("excludeSourceTypes") excludeSourceTypes?: string,
    @CurrentUser() user?: User,
  ) {
    const approvalFilter =
      approval ?? (user?.role === "coach" || user?.role === "admin" ? "all" : "approved");
    const excluded = parseCsvQueryParam(excludeSourceTypes);
    return nutritionDbService.listFoods(
      q,
      category,
      includeInactive,
      approvalFilter,
      page,
      pageSize,
      sourceType,
      excluded,
    );
  }

  @Authorized(["coach", "admin", "data_entry_staff", "consumer"])
  @Get("/foods/:id")
  food(@Param("id") id: string) {
    return nutritionDbService.getFood(id);
  }

  @Authorized(["coach", "admin", "data_entry_staff", "consumer"])
  @Get("/lookup")
  lookup(@QueryParam("name") name: string) {
    return nutritionDbService.lookupByName(name);
  }

  @Authorized(["coach", "admin", "data_entry_staff", "consumer"])
  @Get("/barcode/:code")
  barcode(@Param("code") code: string) {
    return nutritionDbService.lookupByBarcode(code);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Get("/categories")
  async categories() {
    return nutritionDbService.listCategories();
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Get("/serving-units")
  servingUnits() {
    return nutritionDbService.listServingUnits();
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Post("/foods")
  createFood(@Body() dto: CreateNutritionFoodDto, @CurrentUser() user: User) {
    const coachSubmitted = user.role === "coach";
    // Coach defaults to draft unless client sends asDraft: false (submit path).
    const body =
      coachSubmitted && dto.asDraft === undefined ? { ...dto, asDraft: true } : dto;
    return nutritionDbService.createFood(body, user.id, coachSubmitted);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Patch("/foods/:id")
  updateFood(@Param("id") id: string, @Body() dto: UpdateNutritionFoodDto) {
    return nutritionDbService.updateFood(id, dto);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Post("/foods/:id/submit")
  submitFood(@Param("id") id: string, @CurrentUser() user: User) {
    return nutritionDbService.submitFoodForReview(id, user.id);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Post("/foods/:id/return")
  returnFood(@Param("id") id: string) {
    return nutritionDbService.returnFoodToDraft(id);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Post("/foods/:id/approve")
  approveFood(@Param("id") id: string, @CurrentUser() user: User) {
    return nutritionDbService.approveFood(id, user.id);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Post("/foods/:id/image")
  @UseBefore(imageUpload.single("image"))
  async uploadFoodImage(@Param("id") id: string, @Req() req: Request) {
    const file = req.file;
    if (!file) throw new BadRequestError("Missing image file (field name: image)");
    const { imageUrl } = saveNutritionFoodImage(file.buffer, file.mimetype, id, req);
    return nutritionDbService.setFoodImage(id, imageUrl);
  }
}
