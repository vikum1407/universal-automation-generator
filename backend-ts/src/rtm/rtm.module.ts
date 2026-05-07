import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

import { RTMController } from "./rtm.controller";

import { RTMBuilder }               from "./rtm.builder";
import { RTMGenerationOrchestrator } from "./rtm-generation-orchestrator";
import { RTMAnalyticsService }       from "./rtm.analytics";
import { RTMInsightsEngine }         from "./rtm.insights";
import { RTMDashboardService }       from "./rtm.dashboard";
import { RTMMarkdownService }        from "./rtm.markdown";
import { RTMWriter }                 from "./rtm-writer";
import { RTMService }                from "./rtm.service";

// Phase 1 domain-model providers
import { RTMRepository }    from "./rtm.repository";
import { RTMDomainService } from "./rtm-domain.service";

// Phase 2 mapping providers
import { RtmMappingService }    from "./mapping/rtm-mapping.service";
import { RtmMappingController } from "./mapping/rtm-mapping.controller";

// Phase 3 coverage providers
import { RtmCoverageService }    from "./coverage/rtm-coverage.service";
import { RtmCoverageController } from "./coverage/rtm-coverage.controller";

// Phase 4 test generation providers
import { UITestGeneratorService }        from "./generation/ui-test-generator.service";
import { APITestGeneratorService }       from "./generation/api-test-generator.service";
import { HybridTestGeneratorService }    from "./generation/hybrid-test-generator.service";
import { RtmTestGenerationService }      from "./generation/rtm-test-generation.service";
import { RtmTestGenerationController }   from "./generation/rtm-test-generation.controller";

// Phase 5 gap analysis providers
import { CoverageGapService }    from "./gaps/coverage-gap.service";
import { CoverageGapController } from "./gaps/coverage-gap.controller";

// Phase 6 closure loop providers
import { ClosureLoopService }    from "./closure/closure-loop.service";
import { ClosureLoopController } from "./closure/closure-loop.controller";

// Phase 9 AI providers
import { AIClient }                  from "../framework/ai/ai-client";
import { AIRequirementExtractor }    from "./ai/ai-requirement-extractor";
import { AIRequirementClusterer }    from "./ai/ai-requirement-clusterer";
import { AIRequirementRewriter }     from "./ai/ai-requirement-rewriter";
import { AIRiskScorer }              from "./ai/ai-risk-scorer";
import { RtmAIService }              from "./ai/rtm-ai.service";
import { RtmAIController }           from "./ai/rtm-ai.controller";

@Module({
  controllers: [
    RTMController, RtmMappingController, RtmCoverageController,
    RtmTestGenerationController, CoverageGapController,
    ClosureLoopController, RtmAIController,
  ],
  providers: [
    PrismaService,

    // Existing file-based RTM providers
    RTMService,
    RTMBuilder,
    RTMGenerationOrchestrator,
    RTMAnalyticsService,
    RTMInsightsEngine,
    RTMDashboardService,
    RTMMarkdownService,
    RTMWriter,

    // Phase 1 domain-model providers
    RTMRepository,
    RTMDomainService,

    // Phase 2 mapping providers
    RtmMappingService,

    // Phase 3 coverage providers
    RtmCoverageService,

    // Phase 4 test generation providers
    UITestGeneratorService,
    APITestGeneratorService,
    HybridTestGeneratorService,
    RtmTestGenerationService,

    // Phase 5 gap analysis providers
    CoverageGapService,

    // Phase 6 closure loop providers
    ClosureLoopService,

    // Phase 9 AI providers
    AIClient,
    AIRequirementExtractor,
    AIRequirementClusterer,
    AIRequirementRewriter,
    AIRiskScorer,
    RtmAIService,
  ],
  exports: [
    RTMService,
    RTMBuilder,
    RTMGenerationOrchestrator,
    RTMAnalyticsService,
    RTMInsightsEngine,
    RTMDashboardService,
    RTMMarkdownService,
    RTMWriter,
    RTMRepository,
    RTMDomainService,
    RtmMappingService,
    RtmCoverageService,
    RtmTestGenerationService,
    CoverageGapService,
    ClosureLoopService,
  ],
})
export class RTMModule {}
