import { Injectable } from '@nestjs/common';
import { ExecutionRouter } from './execution.router';
import { HistoryService } from '../history/history.service';

@Injectable()
export class ExecutionService {
  constructor(
    private readonly router: ExecutionRouter,
    private readonly history: HistoryService
  ) {}

  async run(project: string, frameworkPath: string) {
    const result = await this.router.auto(project, frameworkPath);

    const total = result.summary?.total ?? 0;
    const passed = result.summary?.passed ?? 0;

    const executionPercent = total === 0 ? 0 : (passed / total) * 100;

    const analytics = {
      coverage: {
        coveragePercent: executionPercent,
        aiEnrichedCount: 0
      },
      execution: {
        executionPercent
      },
      highRiskAreas: []
    };

    this.history.saveRun({
      project,
      rtm: null,
      execution: result,
      analytics,
      insights: null
    });

    return result;
  }
}
