import { Controller, Get, Param } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";

@Controller("api/analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("suites")
  async getSuites() {
    return this.analytics.getSuiteOverview();
  }

  @Get("tests/:testId")
  async getTestDetail(@Param("testId") testId: string) {
    return this.analytics.getTestDetail(testId);
  }

  @Get("runs/:runId")
  async getRunDetail(@Param("runId") runId: string) {
    return this.analytics.getRunDetail(runId);
  }
}
