import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { RTMModule } from './rtm/rtm.module';
import { HistoryModule } from './history/history.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExecutionModule } from './execution/execution.module';

import { UIFlowOrchestrator } from './ui-scan/ui-flow-orchestrator';
import { TestsModule } from './tests/tests.module';

import { ProjectModule } from './projects/project.module';
import { UiModule } from './projects/ui/ui.module';
import { ApiModule } from './projects/api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    OrchestratorModule,
    RTMModule,
    HistoryModule,
    DashboardModule,
    ExecutionModule,
    TestsModule,

    ProjectModule,
    UiModule,
    ApiModule
  ],
  controllers: [],
  providers: [
    UIFlowOrchestrator
  ],
})
export class AppModule {}
