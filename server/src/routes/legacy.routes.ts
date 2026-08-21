import { Router } from "express";
import { healthService } from "../modules/health/health.service";

/** Flask mobile/backend compatibility (vitaway.nsengi.space root paths). */
const legacyRoutes = Router();

legacyRoutes.get("/health", (_req, res) => {
  res.json(healthService.getStatus());
});

legacyRoutes.get("/health/ready", async (_req, res) => {
  res.json(await healthService.getReadiness());
});

export default legacyRoutes;
