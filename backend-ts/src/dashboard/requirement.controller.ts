import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard/projects')
export class RequirementController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':project/requirements')
  async listRequirements(@Param('project') project: string) {
    return this.dashboardService.listRequirements(project);
  }

  @Get(':project/requirements/:requirementId')
  async getRequirementDetails(
    @Param('project') project: string,
    @Param('requirementId') requirementId: string,
  ) {
    return this.dashboardService.getRequirementDetails(project, requirementId);
  }
}
