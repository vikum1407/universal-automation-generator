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
    APIAnalyticsController
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
