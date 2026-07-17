import { Authorized, Controller, CurrentUser, Get, Post, QueryParam } from "routing-controllers";
import type { User } from "../users/user.entity";
import { consumerService } from "../consumers/consumer.service";
import { reportsService, type ReportRangeInput } from "./reports.service";
import type { ReportPeriod } from "./report-snapshot.entity";

@Controller("/reports")
export class ReportsController {
  @Authorized(["admin"])
  @Post("/generate")
  async generate(
    @QueryParam("period") period?: ReportPeriod,
    @QueryParam("from") from?: string,
    @QueryParam("to") to?: string,
  ) {
    const range: ReportRangeInput = {
      period: from || to ? period ?? "custom" : period ?? "weekly",
      from,
      to,
    };
    // Admin reports are date-range platform snapshots only (coach/consumer snapshots stay on the scheduler).
    const platform = await reportsService.generatePlatformSnapshot(range);
    return {
      platform: {
        id: platform.id,
        period: platform.period,
        periodStart: platform.periodStart,
        periodEnd: platform.periodEnd,
        metrics: platform.metrics,
        createdAt: platform.createdAt.toISOString(),
      },
    };
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
