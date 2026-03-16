import { Module } from '@nestjs/common';

import { UiIngestionService } from '../ui-scan/ui-ingestion.service';
import { ApiIngestionService } from '../api-scan/api-ingestion.service';

import { IngestionOrchestrator } from './ingestion-orchestrator';

@Module({
  providers: [
    UiIngestionService,
    ApiIngestionService,
    IngestionOrchestrator
  ],
  exports: [
    UiIngestionService,
    ApiIngestionService,
    IngestionOrchestrator
  ]
})
export class OrchestratorModule {}
