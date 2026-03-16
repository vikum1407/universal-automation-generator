import { Module } from '@nestjs/common';

import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { RTMModule } from './rtm/rtm.module';
import { HistoryModule } from './history/history.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExecutionModule } from './execution/execution.module';

import { UIFlowOrchestrator } from './ui-scan/ui-flow-orchestrator';

@Module({
  imports: [
    OrchestratorModule,
    RTMModule,
    HistoryModule,
    DashboardModule,
    ExecutionModule
  ],
  controllers: [],   
  providers: [
    UIFlowOrchestrator
  ],
})
export class AppModule {}
