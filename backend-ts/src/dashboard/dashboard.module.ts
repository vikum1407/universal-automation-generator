import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { ReleaseController } from './release.controller';
import { RequirementController } from './requirement.controller';

import { DashboardService } from './dashboard.service';
import { HistoryModule } from '../history/history.module';

import { ExecutionInsightsEngine } from './execution-insights.engine';
import { ReleaseReadinessEngine } from './release-readiness.engine';
import { ReleaseIntelligenceEngine } from './release-intelligence.engine';
import { ReleaseNotesEngine } from './release-notes.engine';
import { ReleaseTimelineEngine } from './release-timeline.engine';
import { QualityGatesEngine } from './quality-gates.engine';
import { UnifiedReleaseReportEngine } from './unified-release-report.engine';
import { ReleaseHeatmapEngine } from './release-heatmap.engine';
import { ReleaseStoryEngine } from './release-story.engine';
import { ReleaseEvolutionEngine } from './release-evolution.engine';

import { RequirementRiskEngine } from './requirement-risk.engine';
import { RequirementHistoryEngine } from './requirement-history.engine';
import { RequirementPatternsEngine } from './requirement-patterns.engine';
import { RequirementFixesEngine } from './requirement-fixes.engine';
import { SelfHealingController } from './self-healing.controller';
import { SelfHealingEngine } from './self-healing.engine';
import { StabilityModule } from '../stability/stability.module';

@Module({
  imports: [
    HistoryModule,
    StabilityModule
  ],
  controllers: [
    DashboardController,
    ReleaseController,
    RequirementController,
    SelfHealingController
  ],
  providers: [
    DashboardService,

    ExecutionInsightsEngine,
    ReleaseReadinessEngine,
    ReleaseIntelligenceEngine,
    ReleaseNotesEngine,
    ReleaseTimelineEngine,
    QualityGatesEngine,
    UnifiedReleaseReportEngine,
    ReleaseHeatmapEngine,
    ReleaseStoryEngine,
    ReleaseEvolutionEngine,

    RequirementRiskEngine,
    RequirementHistoryEngine,
    RequirementPatternsEngine,
    RequirementFixesEngine,
    SelfHealingEngine
  ],
  exports: [DashboardService]
})
export class DashboardModule {}
