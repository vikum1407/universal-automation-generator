import { Module } from '@nestjs/common';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';
import { ExecutionEngine } from './execution.engine';
import { TestRunnerService } from './test-runner.service';
import { UIExecutionAdapter } from './ui-execution.adapter';
import { APIExecutionAdapter } from './api-execution.adapter';
import { ExecutionRouter } from './execution.router';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [HistoryModule],
  controllers: [ExecutionController],
  providers: [
    ExecutionService,
    ExecutionEngine,
    ExecutionRouter,
    UIExecutionAdapter,
    APIExecutionAdapter,
    TestRunnerService
  ],
  exports: [ExecutionService]
})
export class ExecutionModule {}
