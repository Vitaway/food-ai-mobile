import { Controller, Get } from "routing-controllers";
import { healthService } from "./health.service";

@Controller("/health")
export class HealthController {
  @Get()
  getStatus() {
    return healthService.getStatus();
  }

  @Get("/ready")
  async getReadiness() {
    return healthService.getReadiness();
  }

  @Get("/runtime")
  async getRuntime() {
    return healthService.getRuntimeMetrics();
  }
}
