import { Module } from '@nestjs/common';
import { RTMController } from './rtm.controller';

import { RTMGenerationOrchestrator } from './rtm-generation-orchestrator';
import { IngestionOrchestrator } from '../orchestrator/ingestion-orchestrator';
import { UnifiedTestCaseGenerator } from '../generator/unified-test-case-generator';

import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    OrchestratorModule,
    HistoryModule   // <-- REQUIRED FIX
  ],
  controllers: [RTMController],
  providers: [
    RTMGenerationOrchestrator,
    IngestionOrchestrator,
    UnifiedTestCaseGenerator
  ],
  exports: [RTMGenerationOrchestrator]
})
export class RTMModule {}
