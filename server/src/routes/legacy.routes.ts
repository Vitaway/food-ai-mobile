import { Router } from "express";
import multer from "multer";
import { BadRequestError } from "routing-controllers";
import { healthService } from "../modules/health/health.service";
import { visionService } from "../modules/vision/vision.service";
import { visionDetectRateLimit } from "../middlewares/rate-limit.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

/** Flask mobile/backend compatibility (vitaway.nsengi.space root paths). */
const legacyRoutes = Router();

legacyRoutes.get("/health", (_req, res) => {
  res.json(healthService.getStatus());
});

legacyRoutes.get("/health/ready", async (_req, res) => {
  res.json(await healthService.getReadiness());
});

legacyRoutes.post(
  "/plates/detect",
  visionDetectRateLimit,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) {
        throw new BadRequestError("Missing image file (field name: image)");
      }
      const metadata = typeof req.body?.metadata === "string" ? req.body.metadata : "{}";
      const result = await visionService.detectPlate(file.buffer, file.mimetype, metadata);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default legacyRoutes;
