import { Module } from '@nestjs/common';
import { UiIngestionService } from './ui-ingestion.service';

@Module({
  providers: [UiIngestionService],
  exports: [UiIngestionService],
})
export class UIScanModule {}
