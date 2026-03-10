import { Module } from '@nestjs/common';
import { APIScanController } from './api-scan/api-scan.controller';
import { UIScanController } from './ui-scan/ui-scan.controller';
import { ExecutionController } from './execution/execution.controller';
import { RTMController } from './rtm/rtm.controller';
import { EnhanceController } from './enhance/enhance.controller';
import { UIGenerateController } from './ui-scan/ui-generate.controller';
import { UIRunController } from './ui-scan/ui-run.controller';
import { UIFlowOrchestrator } from './ui-scan/ui-flow-orchestrator';

@Module({
  controllers: [
    UIScanController,
    APIScanController,
    ExecutionController,
    RTMController,
    EnhanceController,
    UIGenerateController,
    UIRunController
  ],
  providers: [
    UIFlowOrchestrator
  ],
})
export class AppModule {}
