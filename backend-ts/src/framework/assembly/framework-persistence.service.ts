import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService }      from '../../../prisma/prisma.service';
import type { AssemblyResult } from './assembly-orchestrator';
import type { FrameworkBlueprint, CoverageLevel } from '../blueprint/blueprint.model';

export interface PersistenceResult {
  projectId:    string;
  frameworkId:  string;
  versionId:    string;
  versionNumber: number;
  isNew:        boolean;
}

export interface RegenerateOverrides {
  websiteUrl?:    string;
  swaggerUrl?:    string;
  swaggerFile?:   string;
  coverageLevel?: CoverageLevel;
  label?:         string;
}

@Injectable()
export class FrameworkPersistenceService {
  private readonly logger = new Logger(FrameworkPersistenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Save (create or update) ───────────────────────────────────────────────────

  async saveGeneration(
    result:    AssemblyResult,
    blueprint: FrameworkBlueprint,
  ): Promise<PersistenceResult> {

    // 1. Resolve or auto-create Project
    const projectId = blueprint.projectId ?? await this.createProject(blueprint, result);
    this.logger.log(`Saving generation to project ${projectId}`);

    // Enrich blueprint with resolved projectId so regeneration can find it
    const enrichedBlueprint: FrameworkBlueprint = { ...blueprint, projectId };

    // 2. Find existing Framework for (projectId, frameworkType, language)
    const existing = await this.prisma.framework.findFirst({
      where: {
        projectId,
        frameworkType: blueprint.framework,
        language:      (blueprint.language ?? 'typescript').toLowerCase(),
      },
    });

    const isNew = !existing;
    let frameworkId: string;
    let nextVersion: number;

    // 3. Create or update Framework record
    if (existing) {
      nextVersion = existing.versionNumber + 1;
      await this.prisma.framework.update({
        where: { id: existing.id },
        data: {
          blueprint:        enrichedBlueprint as any,
          artifactLocation: result.downloadUrl,
          versionNumber:    nextVersion,
          status:           'generated',
        },
      });
      frameworkId = existing.id;
      this.logger.log(`Updated Framework ${frameworkId} → v${nextVersion}`);
    } else {
      nextVersion = 1;
      const created = await this.prisma.framework.create({
        data: {
          projectId,
          name:             result.projectName,
          frameworkType:    blueprint.framework,
          language:         (blueprint.language ?? 'typescript').toLowerCase(),
          blueprint:        enrichedBlueprint as any,
          artifactLocation: result.downloadUrl,
          versionNumber:    nextVersion,
          status:           'generated',
          createdBy:        'framework-generator',
        },
      });
      frameworkId = created.id;
      this.logger.log(`Created Framework ${frameworkId} v1`);
    }

    // 4. Create FrameworkVersion snapshot
    const version = await this.prisma.frameworkVersion.create({
      data: {
        frameworkId,
        versionNumber:    nextVersion,
        blueprint:        enrichedBlueprint as any,
        artifactLocation: result.downloadUrl,
        fileCount:        result.fileCount,
        projectStructure: result.projectStructure,
      },
    });

    // 5. Point Framework.currentVersionId at the new version
    await this.prisma.framework.update({
      where: { id: frameworkId },
      data:  { currentVersionId: version.id },
    });

    // 6. Write History entry
    await this.prisma.history.create({
      data: {
        projectId,
        event: isNew ? 'framework_generated' : 'framework_regenerated',
        metadata: {
          frameworkId,
          versionId:     version.id,
          versionNumber: nextVersion,
          framework:     blueprint.framework,
          language:      blueprint.language ?? 'typescript',
          fileCount:     result.fileCount,
          aiDocs:        result.aiDocs,
          aiHeaders:     result.aiHeaders,
          jobId:         result.jobId,
        },
      },
    });

    this.logger.log(`Persisted v${nextVersion} (${result.fileCount} files) — history written`);
    return { projectId, frameworkId, versionId: version.id, versionNumber: nextVersion, isNew };
  }

  // ── Label a specific version ──────────────────────────────────────────────────

  async labelVersion(versionId: string, label: string): Promise<void> {
    await this.prisma.frameworkVersion.update({
      where: { id: versionId },
      data:  { label },
    });
  }

  // ── Read ──────────────────────────────────────────────────────────────────────

  async loadBlueprint(frameworkId: string): Promise<FrameworkBlueprint> {
    const framework = await this.prisma.framework.findUnique({
      where:  { id: frameworkId },
      select: { blueprint: true },
    });
    if (!framework?.blueprint) {
      throw new NotFoundException(`Framework "${frameworkId}" not found or has no saved blueprint.`);
    }
    return framework.blueprint as unknown as FrameworkBlueprint;
  }

  async loadVersionBlueprint(versionId: string): Promise<FrameworkBlueprint> {
    const version = await this.prisma.frameworkVersion.findUnique({
      where:  { id: versionId },
      select: { blueprint: true },
    });
    if (!version?.blueprint) {
      throw new NotFoundException(`FrameworkVersion "${versionId}" not found.`);
    }
    return version.blueprint as unknown as FrameworkBlueprint;
  }

  async getFramework(frameworkId: string) {
    const framework = await this.prisma.framework.findUnique({
      where:   { id: frameworkId },
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
      },
    });
    if (!framework) throw new NotFoundException(`Framework "${frameworkId}" not found.`);
    return framework;
  }

  async getProjectFrameworks(projectId: string) {
    return this.prisma.framework.findMany({
      where:   { projectId },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private async createProject(
    blueprint: FrameworkBlueprint,
    result:    AssemblyResult,
  ): Promise<string> {
    const name = blueprint.projectName
      ?? blueprint.metadata?.name
      ?? result.projectName
      ?? 'Qlitz Project';

    const type = blueprint.framework === 'restassured' ? 'api' : 'ui';

    const project = await this.prisma.project.create({
      data: {
        name,
        type,
        status:     'active',
        url:        blueprint.websiteUrl ?? null,
        swaggerUrl: blueprint.swaggerUrl ?? null,
      },
    });

    this.logger.log(`Auto-created Project "${name}" (${project.id})`);
    return project.id;
  }
}
