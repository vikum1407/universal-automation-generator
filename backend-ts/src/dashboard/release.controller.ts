import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('release')
export class ReleaseController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get(':project/heatmap')
  heatmap(@Param('project') project: string) {
    return this.dashboard.heatmap(project);
  }

  @Get(':project/story')
  story(@Param('project') project: string) {
    return this.dashboard.releaseStory(project);
  }

  @Get(':project/evolution')
  evolution(@Param('project') project: string) {
    return this.dashboard.evolution(project);
  }
}
