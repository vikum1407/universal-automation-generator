import { Module } from "@nestjs/common";

import { RTMController } from "./rtm.controller";

import { RTMBuilder } from "./rtm.builder";
import { RTMGenerationOrchestrator } from "./rtm-generation-orchestrator";

import { RTMAnalyticsService } from "./rtm.analytics";
import { RTMInsightsEngine } from "./rtm.insights";
import { RTMDashboardService } from "./rtm.dashboard";

import { RTMMarkdownService } from "./rtm.markdown";
import { RTMWriter } from "./rtm-writer";

import { RTMService } from "./rtm.service";

@Module({
  controllers: [RTMController],
  providers: [
    RTMService,
    RTMBuilder,
    RTMGenerationOrchestrator,
    RTMAnalyticsService,
    RTMInsightsEngine,
    RTMDashboardService,
    RTMMarkdownService,
    RTMWriter
  ],
  exports: [
    RTMService,
    RTMBuilder,
    RTMGenerationOrchestrator,
    RTMAnalyticsService,
    RTMInsightsEngine,
    RTMDashboardService,
    RTMMarkdownService,
    RTMWriter
  ]
})
export class RTMModule {}
