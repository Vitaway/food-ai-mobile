import { Authorized, Controller, CurrentUser, Get, Post, QueryParam } from "routing-controllers";
import type { User } from "../users/user.entity";
import { consumerService } from "../consumers/consumer.service";
import { reportsService } from "./reports.service";

@Controller("/reports")
export class ReportsController {
  @Authorized(["admin"])
  @Post("/generate")
  async generate(@QueryParam("period") period?: "weekly" | "monthly") {
    const p = period ?? "weekly";
    const platform = await reportsService.generatePlatformSnapshot(p);
    const consumers = await reportsService.generateAllConsumerSnapshots(p);
    const coaches = await reportsService.generateAllCoachSnapshots(p);
    return { platform, consumerCount: consumers.length, coachCount: coaches.length };
  }

  @Authorized(["admin"])
  @Get("/summary")
  summary() {
    return reportsService.summary();
  }

  @Authorized(["consumer"])
  @Get("/my")
  async myReports(@CurrentUser() user: User) {
    const profile = await consumerService.requireProfileForUser(user.id);
    const existing = await reportsService.listForConsumer(profile.id);
    if (!existing.length) {
      await reportsService.generateConsumerSnapshot(profile.id, "weekly");
      return reportsService.listForConsumer(profile.id);
    }
    return existing;
  }

  @Authorized(["coach", "admin"])
  @Get("/coach")
  async coachReports(@CurrentUser() user: User) {
    const existing = await reportsService.listForCoach(user.id);
    if (!existing.length) {
      await reportsService.generateCoachSnapshot(user.id, "weekly");
      return reportsService.listForCoach(user.id);
    }
    return existing;
  }
}
