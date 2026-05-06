import { Module } from '@nestjs/common';

import { ProjectService } from './project.service';
import { CloudService } from '../cloud/cloud.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RefactorService } from '../refactor/refactor.service';

import { ProjectController } from './core/project.controller';
import { UIController } from './ui/ui.controller';
import { APIController } from './api/api.controller';
import { FlowController } from './flow/flow.controller';
import { SuggestionsController } from './suggestions/suggestions.controller';
import { TestsController } from './tests/tests.controller';
import { SyncController } from './sync/sync.controller';
import { RefactorController } from './refactor/refactor.controller';

import { UiModule } from '../projects/ui/ui.module';

import { UiRecrawlController } from "./ui-actions/ui-recrawl.controller";
import { UiRecrawlService } from "./ui-actions/ui-recrawl.service";
import { UiRefactorController } from "./ui-actions/ui-refactor.controller";
import { UiRefactorService } from "./ui-actions/ui-refactor.service";
import { CloudSyncController } from "./ui-actions/cloud-sync.controller";
import { CloudSyncService } from "./ui-actions/cloud-sync.service";

import { ProjectGateway } from './project.gateway';
import { ProgressGateway } from '../gateways/progress.gateway';
import { ReCrawlService } from '../services/ReCrawlService';

import { APIScanController } from './api-scan.controller';
import { ProjectOrchestratorService } from './project-orchestrator.service';
import { ApiTestGenerationService } from './api/api-test-generation.service';
import { APITestGenerator } from './api/api-test-generator';
import { APITestWriter } from './api/api-test-writer';
import { APIAnalyticsController } from './api/api-analytics.controller';
import { CoverageController } from './coverage/coverage.controller';
import { AutoHealController } from './auto-heal/auto-heal.controller';
import { ReplayController } from './replay/replay.controller';
import { SystemMapController } from './system-map/system-map.controller';
import { HistoryController } from './history/history.controller';
import { SettingsController } from './settings/settings.controller';
import { TrendsController } from './trends/trends.controller';
import { InsightsController, OrgInsightsController } from './insights/insights.controller';
import { OverviewController } from './overview/overview.controller';
import { ReadinessController, OrgReadinessController } from './readiness/readiness.controller';
import { HeatMapController } from './heatmap/heatmap.controller';
import { StoryController } from './story/story.controller';
import { ReleaseManagementController } from './release-management/release-management.controller';
import { ForecastController } from './forecast/forecast.controller';
import { BudgetController } from './budgets/budget.controller';
import { OrgIntelligenceController } from '../org/org-intelligence.controller';
import { TestDataController } from './test-data/test-data.controller';
import { WorkflowController, OrgWorkflowController } from './developer-workflow/developer-workflow.controller';
import { GraphController } from './graph/graph.controller';

@Module({
  imports: [
    UiModule,
  ],
  controllers: [
    ProjectController,
    UIController,
    APIController,
    FlowController,
    SuggestionsController,
    TestsController,
    SyncController,
    RefactorController,

    UiRecrawlController,
    UiRefactorController,
    CloudSyncController,

    APIScanController,
    APIAnalyticsController,
    CoverageController,
    AutoHealController,
    ReplayController,
    SystemMapController,
    HistoryController,
    SettingsController,
    TrendsController,
    InsightsController,
    OrgInsightsController,
    OverviewController,
    ReadinessController,
    OrgReadinessController,
    HeatMapController,
    StoryController,
    ReleaseManagementController,
    ForecastController,
    BudgetController,
    OrgIntelligenceController,
    TestDataController,
    WorkflowController,
    OrgWorkflowController,
    GraphController,
  ],
  providers: [
    ProjectService,
    CloudService,
    PrismaService,
    RefactorService,

    UiRecrawlService,
    UiRefactorService,
    CloudSyncService,

    ProjectGateway,
    ProgressGateway,
    ReCrawlService,
    APITestGenerator,     
    APITestWriter,         

    ProjectOrchestratorService,
    ApiTestGenerationService
  ],
  exports: [
    ProjectService,
    ReCrawlService
  ]
})
export class ProjectModule {}
