import { Controller, Get, Param } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get(':project')
  list(@Param('project') project: string) {
    return this.history.listRuns(project);
  }

  @Get('run/:id')
  getRun(@Param('id') id: string) {
    return this.history.getRun(id);
  }

  @Get(':project/trends')
  getTrends(@Param('project') project: string) {
    return this.history.computeTrends(project);
  }
}
