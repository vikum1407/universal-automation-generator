import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RtmRoot }        from './entities/rtm-root.entity';
import type { RtmVersion }     from './entities/rtm-version.entity';
import type { RtmRequirement } from './entities/rtm-requirement.entity';
import type { RtmJourney }     from './entities/rtm-journey.entity';
import type { RtmEndpoint }    from './entities/rtm-endpoint.entity';
import type { CreateRequirementDto, CreateJourneyDto, CreateEndpointDto } from './dto/create-rtm.dto';
import type { UpdateRequirementDto } from './dto/update-requirement.dto';

export interface RTMSnapshot {
  rootId:        string;
  versionId:     string;
  versionNumber: number;
  label:         string | null;
  createdAt:     Date;
  requirements:  RtmRequirement[];
  journeys:      RtmJourney[];
  endpoints:     RtmEndpoint[];
}

@Injectable()
export class RTMRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Root ───────────────────────────────────────────────────────────────────

  async findRootByProject(projectId: string): Promise<RtmRoot | null> {
    return this.prisma.rtmRoot.findUnique({ where: { projectId } }) as any;
  }

  async createRoot(projectId: string): Promise<RtmRoot> {
    return this.prisma.rtmRoot.create({ data: { projectId } }) as any;
  }

  async setCurrentVersion(rootId: string, versionId: string): Promise<void> {
    await this.prisma.rtmRoot.update({
      where: { id: rootId },
      data:  { currentVersionId: versionId },
    });
  }

  // ── Version ────────────────────────────────────────────────────────────────

  async listVersions(rootId: string): Promise<RtmVersion[]> {
    return this.prisma.rtmVersion.findMany({
      where:   { rtmRootId: rootId },
      orderBy: { versionNumber: 'asc' },
    }) as any;
  }

  async findVersionById(versionId: string): Promise<RtmVersion | null> {
    return this.prisma.rtmVersion.findUnique({ where: { id: versionId } }) as any;
  }

  async createVersion(
    rootId: string,
    label?: string,
    createdBy?: string,
  ): Promise<RtmVersion> {
    const last = await this.prisma.rtmVersion.findFirst({
      where:   { rtmRootId: rootId },
      orderBy: { versionNumber: 'desc' },
      select:  { versionNumber: true },
    });
    const next = (last?.versionNumber ?? 0) + 1;
    return this.prisma.rtmVersion.create({
      data: { rtmRootId: rootId, versionNumber: next, label: label ?? null, createdBy: createdBy ?? null },
    }) as any;
  }

  // ── Snapshot ───────────────────────────────────────────────────────────────

  async getSnapshot(versionId: string): Promise<RTMSnapshot | null> {
    const ver = await this.prisma.rtmVersion.findUnique({
      where:   { id: versionId },
      include: {
        requirements: { orderBy: { key: 'asc' } },
        journeys:     { orderBy: { key: 'asc' } },
        endpoints:    { orderBy: { key: 'asc' } },
        root:         { select: { id: true } },
      },
    });
    if (!ver) return null;
    return {
      rootId:        (ver as any).root.id,
      versionId:     ver.id,
      versionNumber: ver.versionNumber,
      label:         ver.label,
      createdAt:     ver.createdAt,
      requirements:  (ver as any).requirements as RtmRequirement[],
      journeys:      (ver as any).journeys     as RtmJourney[],
      endpoints:     (ver as any).endpoints    as RtmEndpoint[],
    };
  }

  // ── Requirements ───────────────────────────────────────────────────────────

  async createRequirement(versionId: string, dto: CreateRequirementDto): Promise<RtmRequirement> {
    return this.prisma.rtmRequirement.create({
      data: {
        rtmVersionId: versionId,
        key:          dto.key,
        title:        dto.title,
        description:  dto.description  ?? '',
        type:         (dto.type        ?? 'functional') as any,
        priority:     (dto.priority    ?? 'P2')         as any,
        risk:         (dto.risk        ?? 'medium')     as any,
        status:       (dto.status      ?? 'draft')      as any,
        tags:         dto.tags ?? [],
      },
    }) as any;
  }

  async createManyRequirements(versionId: string, dtos: CreateRequirementDto[]): Promise<void> {
    await this.prisma.rtmRequirement.createMany({
      data: dtos.map(d => ({
        rtmVersionId: versionId,
        key:          d.key,
        title:        d.title,
        description:  d.description ?? '',
        type:         (d.type     ?? 'functional') as any,
        priority:     (d.priority ?? 'P2')         as any,
        risk:         (d.risk     ?? 'medium')     as any,
        status:       (d.status   ?? 'draft')      as any,
        tags:         d.tags ?? [],
      })),
    });
  }

  async updateRequirement(id: string, dto: UpdateRequirementDto): Promise<RtmRequirement> {
    return this.prisma.rtmRequirement.update({
      where: { id },
      data: {
        ...(dto.title       !== undefined && { title:       dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type        !== undefined && { type:        dto.type as any }),
        ...(dto.priority    !== undefined && { priority:    dto.priority as any }),
        ...(dto.risk        !== undefined && { risk:        dto.risk as any }),
        ...(dto.status      !== undefined && { status:      dto.status as any }),
        ...(dto.tags        !== undefined && { tags:        dto.tags }),
      },
    }) as any;
  }

  async deleteRequirement(id: string): Promise<void> {
    await this.prisma.rtmRequirement.delete({ where: { id } });
  }

  // ── Journeys ───────────────────────────────────────────────────────────────

  async createJourney(versionId: string, dto: CreateJourneyDto): Promise<RtmJourney> {
    return this.prisma.rtmJourney.create({
      data: {
        rtmVersionId:   versionId,
        key:            dto.key,
        name:           dto.name,
        description:    dto.description    ?? '',
        requirementIds: dto.requirementIds ?? [],
      },
    }) as any;
  }

  async createManyJourneys(versionId: string, dtos: CreateJourneyDto[]): Promise<void> {
    await this.prisma.rtmJourney.createMany({
      data: dtos.map(d => ({
        rtmVersionId:   versionId,
        key:            d.key,
        name:           d.name,
        description:    d.description    ?? '',
        requirementIds: d.requirementIds ?? [],
      })),
    });
  }

  // ── Endpoints ──────────────────────────────────────────────────────────────

  async createEndpoint(versionId: string, dto: CreateEndpointDto): Promise<RtmEndpoint> {
    return this.prisma.rtmEndpoint.create({
      data: {
        rtmVersionId:   versionId,
        key:            dto.key,
        method:         dto.method as any,
        path:           dto.path,
        serviceName:    dto.serviceName    ?? null,
        description:    dto.description   ?? '',
        requirementIds: dto.requirementIds ?? [],
      },
    }) as any;
  }

  async createManyEndpoints(versionId: string, dtos: CreateEndpointDto[]): Promise<void> {
    await this.prisma.rtmEndpoint.createMany({
      data: dtos.map(d => ({
        rtmVersionId:   versionId,
        key:            d.key,
        method:         d.method as any,
        path:           d.path,
        serviceName:    d.serviceName    ?? null,
        description:    d.description   ?? '',
        requirementIds: d.requirementIds ?? [],
      })),
    });
  }
}
