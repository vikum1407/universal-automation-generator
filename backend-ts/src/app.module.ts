import { Module } from '@nestjs/common';

import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { RTMModule } from './rtm/rtm.module';
import { HistoryModule } from './history/history.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExecutionModule } from './execution/execution.module';

import { UIFlowOrchestrator } from './ui-scan/ui-flow-orchestrator';
import { TestsModule } from './tests/tests.module';

@Module({
  imports: [
    OrchestratorModule,
    RTMModule,
    HistoryModule,
    DashboardModule,
    ExecutionModule,
    TestsModule   // <-- ADD THIS
  ],
  controllers: [],
  providers: [UIFlowOrchestrator],
})
export class AppModule {}
