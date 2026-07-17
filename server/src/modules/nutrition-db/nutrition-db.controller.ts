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
import { nutritionDbService } from "./nutrition-db.service";
import { saveNutritionFoodImage } from "../../services/uploads.service";

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller("/nutrition-db")
export class NutritionDbController {
  @Authorized(["coach", "admin", "data_entry_staff", "consumer"])
  @Get("/foods")
  foods(
    @QueryParam("q") q?: string,
    @QueryParam("category") category?: string,
    @QueryParam("includeInactive") includeInactive?: boolean,
    @QueryParam("approval") approval?: "approved" | "pending" | "rejected" | "all",
    @QueryParam("page") page?: number,
    @QueryParam("pageSize") pageSize?: number,
    @QueryParam("sourceType") sourceType?: string,
    @CurrentUser() user?: User,
  ) {
    const approvalFilter =
      approval ?? (user?.role === "coach" || user?.role === "admin" ? "all" : "approved");
    return nutritionDbService.listFoods(
      q,
      category,
      includeInactive,
      approvalFilter,
      page,
      pageSize,
      sourceType,
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
    return nutritionDbService.createFood(dto, user.id, coachSubmitted);
  }

  @Authorized(["coach", "admin", "data_entry_staff"])
  @Patch("/foods/:id")
  updateFood(@Param("id") id: string, @Body() dto: UpdateNutritionFoodDto) {
    return nutritionDbService.updateFood(id, dto);
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
