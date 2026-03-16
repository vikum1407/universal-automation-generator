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

    this.history.saveRun({
      project,
      rtm: null,
      execution: result,
      analytics: null,
      insights: null
    });

    return result;
  }
}
