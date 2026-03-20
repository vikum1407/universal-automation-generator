import { Module } from '@nestjs/common';
import { UIScanController } from './ui-scan.controller';
import { UiIngestionService } from './ui-ingestion.service';

@Module({
  controllers: [UIScanController],
  providers: [UiIngestionService],
  exports: [UiIngestionService],
})
export class UIScanModule {}
