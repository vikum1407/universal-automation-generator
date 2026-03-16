import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { TrendAnalyticsEngine } from './trend-analytics.engine';

@Module({
  controllers: [HistoryController],
  providers: [HistoryService, TrendAnalyticsEngine],
  exports: [HistoryService]
})
export class HistoryModule {}
