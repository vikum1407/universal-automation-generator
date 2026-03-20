import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { TestRunService } from './test-run.service';
import { FrameworkGenerationOrchestrator } from '../generator/framework-generation-orchestrator';
import { UnifiedTestCaseGenerator } from '../generator/unified-test-case-generator';

import { UIScanModule } from '../ui-scan/ui-scan.module';
import { APIScanModule } from '../api-scan/api-scan.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

@Module({
  imports: [
    UIScanModule,
    APIScanModule,
    OrchestratorModule
  ],
  controllers: [TestsController],
  providers: [
    TestRunService,
    FrameworkGenerationOrchestrator,
    UnifiedTestCaseGenerator
  ]
})
export class TestsModule {}
