import { Module } from '@nestjs/common';
import { UIController } from './ui.controller';
import { UiService } from './ui.service';
import { UiTestGenerationService } from './ui-test-generation.service';

import { UITestGenerator } from '../../ui-scan/ui-test-generator';
import { UITestWriter } from '../../ui-scan/ui-test-writer';

@Module({
  controllers: [UIController],
  providers: [
    UiService,
    UiTestGenerationService,
    UITestGenerator,
    UITestWriter,
  ],
  exports: [UiService, UiTestGenerationService],
})
export class UiModule {}
