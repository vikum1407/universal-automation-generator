import { Module } from "@nestjs/common";
import { PlaywrightController } from "./playwright.controller";
import { PlaywrightService } from "./playwright.service";
import { PlaywrightGateway } from "./playwright.gateway";

import { IngestionService } from "./services/ingestion.service";
import { TimelineService } from "./services/timeline.service";
import { DistributedService } from "./services/distributed.service";

import { AIClassifierService } from "./ai-classifier.service";
import { AISuggestionService } from "./ai-suggestion.service";
import { AIInsightsService } from "./ai-insights.service";
import { AICrossRunService } from "./ai-cross-run.service";
import { TestAggregationService } from "./test-aggregation.service";
import { AnalyticsController } from "./analytics/analytics.controller";
import { AnalyticsService } from "./analytics/analytics.service";

@Module({
  controllers: [
    PlaywrightController,
    AnalyticsController
  ],
  providers: [
    PlaywrightService,
    PlaywrightGateway,
    IngestionService,
    TimelineService,
    DistributedService,
    AIClassifierService,
    AISuggestionService,
    AIInsightsService,
    AICrossRunService,
    TestAggregationService,
    AnalyticsService
  ]
})
export class PlaywrightModule {}
