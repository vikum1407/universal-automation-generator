import { Injectable } from '@nestjs/common';
import { UIExecutionAdapter } from './ui-execution.adapter';
import { APIExecutionAdapter } from './api-execution.adapter';
import { ExecutionResult } from './execution.model';

@Injectable()
export class ExecutionEngine {
  constructor(
    private readonly ui: UIExecutionAdapter,
    private readonly api: APIExecutionAdapter
  ) {}

  async runFramework(project: string, frameworkPath: string): Promise<ExecutionResult> {
    return this.ui.runPlaywright(project, frameworkPath);
  }

  async runAPI(project: string, collectionPath: string): Promise<ExecutionResult> {
    return this.api.runPostman(project, collectionPath);
  }
}
