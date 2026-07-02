import {
  Authorized,
  BadRequestError,
  Body,
  Controller,
  Post,
  Req,
  UseBefore,
} from "routing-controllers";
import type { Request } from "express";
import multer from "multer";
import { AnalyzeMealTextDto } from "./vision.dto";
import { visionService } from "./vision.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

function parseOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = Number.parseFloat(String(value));
  return Number.isFinite(num) && num > 0 ? num : null;
}

@Controller("/vision")
export class VisionController {
  @Post("/plates/detect")
  @UseBefore(upload.single("image"))
  async detectPlate(@Req() req: Request) {
    const file = req.file;
    if (!file) {
      throw new BadRequestError("Missing image file (field name: image)");
    }
    const metadata = typeof req.body?.metadata === "string" ? req.body.metadata : "{}";
    return visionService.detectPlate(file.buffer, file.mimetype, metadata);
  }

  @Authorized(["consumer"])
  @Post("/meals/analyze")
  @UseBefore(upload.single("image"))
  async analyzeMealImage(@Req() req: Request) {
    const file = req.file;
    if (!file) {
      throw new BadRequestError("Missing image file (field name: image)");
    }
    const metadata = typeof req.body?.metadata === "string" ? req.body.metadata : "{}";
    const plateDiameterCm = parseOptionalNumber(req.body?.plateDiameterCm);
    const note = typeof req.body?.note === "string" ? req.body.note : null;

    return visionService.analyzeMealFromImage(file.buffer, file.mimetype, {
      plateDiameterCm,
      note,
      metadataRaw: metadata,
    });
  }

  @Authorized(["consumer"])
  @Post("/meals/analyze-text")
  async analyzeMealText(@Body() dto: AnalyzeMealTextDto) {
    return visionService.analyzeMealFromText(dto.text, dto.plateDiameterCm ?? null);
  }
}
