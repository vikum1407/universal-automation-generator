import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard/projects')
export class SelfHealingController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':project/self-healing')
  async listSelfHealing(@Param('project') project: string) {
    return this.dashboardService.selfHealingSummary(project);
  }

  @Get(':project/self-healing/:suggestionId')
  async getSelfHealingDetails(
    @Param('project') project: string,
    @Param('suggestionId') suggestionId: string,
  ) {
    return this.dashboardService.selfHealingDetails(project, suggestionId);
  }
}
