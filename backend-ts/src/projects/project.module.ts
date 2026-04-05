import { Module, forwardRef } from '@nestjs/common';

import { ProjectService } from './project.service';
import { ProjectOrchestratorService } from './project-orchestrator.service';
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
import { ApiModule } from '../projects/api/api.module';

import { UiRecrawlController } from "./ui-actions/ui-recrawl.controller";
import { UiRecrawlService } from "./ui-actions/ui-recrawl.service";
import { UiRefactorController } from "./ui-actions/ui-refactor.controller";
import { UiRefactorService } from "./ui-actions/ui-refactor.service";
import { CloudSyncController } from "./ui-actions/cloud-sync.controller";
import { CloudSyncService } from "./ui-actions/cloud-sync.service";

@Module({
  imports: [
    UiModule,
    ApiModule,
    forwardRef(() => ProjectModule)
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
    CloudSyncController
  ],
  providers: [
    ProjectService,
    {
      provide: ProjectOrchestratorService,
      useClass: ProjectOrchestratorService
    },
    CloudService,
    PrismaService,
    RefactorService,

    UiRecrawlService,
    UiRefactorService,
    CloudSyncService
  ],
  exports: [
    ProjectService,
    ProjectOrchestratorService
  ]
})
export class ProjectModule {}
