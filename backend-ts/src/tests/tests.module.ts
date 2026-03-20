import { Module } from '@nestjs/common';

import { TestsController } from './tests.controller';

// Generators
import { FrameworkGenerationOrchestrator } from '../generator/framework-generation-orchestrator';
import { UnifiedTestCaseGenerator } from '../generator/unified-test-case-generator';

// Ingestion orchestrator
import { IngestionOrchestrator } from '../orchestrator/ingestion-orchestrator';

// Correct module names
import { UIScanModule } from '../ui-scan/ui-scan.module';
import { APIScanModule } from '../api-scan/api-scan.module';

@Module({
  imports: [
    UIScanModule,   // provides UiIngestionService
    APIScanModule   // provides ApiIngestionService
  ],
  controllers: [TestsController],
  providers: [
    FrameworkGenerationOrchestrator,
    UnifiedTestCaseGenerator,
    IngestionOrchestrator
  ],
  exports: [
    FrameworkGenerationOrchestrator
  ]
})
export class TestsModule {}
