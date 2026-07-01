import {
  BadRequestError,
  Controller,
  Post,
  Req,
  UseBefore,
} from "routing-controllers";
import type { Request } from "express";
import multer from "multer";
import { visionService } from "./vision.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

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
}
