import { Controller, Post, Body } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectOrchestratorService } from '../projects/project-orchestrator.service';
import { ProgressGateway } from '../gateways/progress.gateway';
import { progressService } from '../services/ProgressService';

@Controller('projects')
export class APIScanController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: ProjectOrchestratorService,
    private readonly gateway: ProgressGateway
  ) {}

  @Post('scan-api')
  async scan(@Body() body: {
    swaggerUrl?: string;
    swaggerFilePath?: string;
    authToken?: string;
    env?: string;
  }) {
    const { swaggerUrl, swaggerFilePath, authToken, env } = body;

    const project = await this.prisma.project.create({
      data: {
        type: 'api',
        swaggerUrl: swaggerUrl ?? '',
        swaggerFilePath: swaggerFilePath ?? '',
        authToken: authToken ?? '',
        env: env ?? 'production',
        status: 'initializing'
      }
    });

    // Init progress once here — runAPIInitialization must NOT call init again
    progressService.init(project.id, 'initializing');
    this.gateway.emitProjectStatus(project.id);

    // Run pipeline async
    this.orchestrator.runAPIInitialization(project).catch(() => {});

    return { projectId: project.id };
  }
}