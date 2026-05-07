import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { RequirementMappingSummary, JourneyMappingSummary } from './entities/hybrid-mapping.entity';
import type { DiscoveredFlow }     from './entities/ui-flow-mapping.entity';
import type { DiscoveredEndpoint } from './entities/api-endpoint-mapping.entity';

// ─── Text-similarity helper ────────────────────────────────────────────────────
// Returns a [0,1] Jaccard score between two strings (word tokens, length > 2).
function wordScore(a: string, b: string): number {
  const tok = (s: string) =>
    new Set(s.toLowerCase().split(/[\s\-_\/\.]+/).filter(w => w.length > 2));
  const wa = tok(a);
  const wb = tok(b);
  if (!wa.size || !wb.size) return 0;
  const intersection = [...wa].filter(w => wb.has(w)).length;
  return intersection / (wa.size + wb.size - intersection);
}

@Injectable()
export class RtmMappingService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Discovery catalog ────────────────────────────────────────────────────────

  async listDiscoveredFlows(projectId: string): Promise<DiscoveredFlow[]> {
    const rows = await this.prisma.flow.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => ({
      id: r.id, projectId: r.projectId, name: r.name,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async listDiscoveredEndpoints(projectId: string): Promise<DiscoveredEndpoint[]> {
    const rows = await this.prisma.endpoint.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => ({
      id: r.id, projectId: r.projectId, method: r.method,
      path: r.path, flowId: r.flowId ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  // ─── Requirement ↔ UI Flow ────────────────────────────────────────────────────

  async linkReqToFlow(
    projectId: string, rtmVersionId: string,
    requirementId: string, flowId: string,
    strength: 'primary' | 'secondary' = 'primary',
  ) {
    try {
      return await this.prisma.rtmReqFlowMapping.create({
        data: { projectId, rtmVersionId, requirementId, flowId, strength },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Mapping already exists');
      throw e;
    }
  }

  async unlinkReqFromFlow(requirementId: string, flowId: string) {
    const existing = await this.prisma.rtmReqFlowMapping.findUnique({
      where: { requirementId_flowId: { requirementId, flowId } },
    });
    if (!existing) throw new NotFoundException('Mapping not found');
    await this.prisma.rtmReqFlowMapping.delete({
      where: { requirementId_flowId: { requirementId, flowId } },
    });
  }

  async getReqFlowMappings(requirementId: string) {
    return this.prisma.rtmReqFlowMapping.findMany({ where: { requirementId } });
  }

  // ─── Requirement ↔ API Endpoint ───────────────────────────────────────────────

  async linkReqToEndpoint(
    projectId: string, rtmVersionId: string,
    requirementId: string, discoveredEndpointId: string,
    strength: 'primary' | 'secondary' = 'primary',
  ) {
    try {
      return await this.prisma.rtmReqEndpointMapping.create({
        data: { projectId, rtmVersionId, requirementId, discoveredEndpointId, strength },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Mapping already exists');
      throw e;
    }
  }

  async unlinkReqFromEndpoint(requirementId: string, discoveredEndpointId: string) {
    const existing = await this.prisma.rtmReqEndpointMapping.findUnique({
      where: { requirementId_discoveredEndpointId: { requirementId, discoveredEndpointId } },
    });
    if (!existing) throw new NotFoundException('Mapping not found');
    await this.prisma.rtmReqEndpointMapping.delete({
      where: { requirementId_discoveredEndpointId: { requirementId, discoveredEndpointId } },
    });
  }

  async getReqEndpointMappings(requirementId: string) {
    return this.prisma.rtmReqEndpointMapping.findMany({ where: { requirementId } });
  }

  // ─── Journey ↔ UI Flow ────────────────────────────────────────────────────────

  async linkJourneyToFlow(
    projectId: string, rtmVersionId: string,
    journeyId: string, flowId: string,
  ) {
    try {
      return await this.prisma.rtmJourneyFlowMapping.create({
        data: { projectId, rtmVersionId, journeyId, flowId },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Mapping already exists');
      throw e;
    }
  }

  async unlinkJourneyFromFlow(journeyId: string, flowId: string) {
    const existing = await this.prisma.rtmJourneyFlowMapping.findUnique({
      where: { journeyId_flowId: { journeyId, flowId } },
    });
    if (!existing) throw new NotFoundException('Mapping not found');
    await this.prisma.rtmJourneyFlowMapping.delete({
      where: { journeyId_flowId: { journeyId, flowId } },
    });
  }

  async getJourneyFlowMappings(journeyId: string) {
    return this.prisma.rtmJourneyFlowMapping.findMany({ where: { journeyId } });
  }

  // ─── Journey ↔ API Endpoint ───────────────────────────────────────────────────

  async linkJourneyToEndpoint(
    projectId: string, rtmVersionId: string,
    journeyId: string, discoveredEndpointId: string,
  ) {
    try {
      return await this.prisma.rtmJourneyEndpointMapping.create({
        data: { projectId, rtmVersionId, journeyId, discoveredEndpointId },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Mapping already exists');
      throw e;
    }
  }

  async unlinkJourneyFromEndpoint(journeyId: string, discoveredEndpointId: string) {
    const existing = await this.prisma.rtmJourneyEndpointMapping.findUnique({
      where: { journeyId_discoveredEndpointId: { journeyId, discoveredEndpointId } },
    });
    if (!existing) throw new NotFoundException('Mapping not found');
    await this.prisma.rtmJourneyEndpointMapping.delete({
      where: { journeyId_discoveredEndpointId: { journeyId, discoveredEndpointId } },
    });
  }

  async getJourneyEndpointMappings(journeyId: string) {
    return this.prisma.rtmJourneyEndpointMapping.findMany({ where: { journeyId } });
  }

  // ─── Requirement mapping summary ──────────────────────────────────────────────

  async getRequirementMappingSummary(
    projectId: string, rtmVersionId: string, requirementId: string,
  ): Promise<RequirementMappingSummary> {
    const [flowMappings, endpointMappings, version] = await Promise.all([
      this.prisma.rtmReqFlowMapping.findMany({ where: { requirementId } }),
      this.prisma.rtmReqEndpointMapping.findMany({ where: { requirementId } }),
      this.prisma.rtmVersion.findUnique({
        where: { id: rtmVersionId },
        include: { journeys: true },
      }),
    ]);

    const flowIds = flowMappings.map(m => m.flowId);
    const endpointIds = endpointMappings.map(m => m.discoveredEndpointId);

    const [flows, endpoints] = await Promise.all([
      flowIds.length
        ? this.prisma.flow.findMany({ where: { id: { in: flowIds } } })
        : Promise.resolve([]),
      endpointIds.length
        ? this.prisma.endpoint.findMany({ where: { id: { in: endpointIds } } })
        : Promise.resolve([]),
    ]);

    const journeys = (version?.journeys ?? []).filter(j =>
      j.requirementIds.includes(requirementId)
    );

    return {
      requirementId,
      uiFlows: flowMappings.map(m => {
        const f = flows.find(x => x.id === m.flowId);
        return { id: m.flowId, name: f?.name ?? m.flowId, strength: m.strength };
      }),
      endpoints: endpointMappings.map(m => {
        const e = endpoints.find(x => x.id === m.discoveredEndpointId);
        return { id: m.discoveredEndpointId, method: e?.method ?? '?', path: e?.path ?? m.discoveredEndpointId, strength: m.strength };
      }),
      journeys: journeys.map(j => ({ id: j.id, name: j.name })),
    };
  }

  // ─── Journey mapping summary ──────────────────────────────────────────────────

  async getJourneyMappingSummary(
    projectId: string, rtmVersionId: string, journeyId: string,
  ): Promise<JourneyMappingSummary> {
    const [flowMappings, endpointMappings, journey] = await Promise.all([
      this.prisma.rtmJourneyFlowMapping.findMany({ where: { journeyId } }),
      this.prisma.rtmJourneyEndpointMapping.findMany({ where: { journeyId } }),
      this.prisma.rtmJourney.findUnique({ where: { id: journeyId } }),
    ]);

    const flowIds = flowMappings.map(m => m.flowId);
    const endpointIds = endpointMappings.map(m => m.discoveredEndpointId);

    const [flows, endpoints] = await Promise.all([
      flowIds.length
        ? this.prisma.flow.findMany({ where: { id: { in: flowIds } } })
        : Promise.resolve([]),
      endpointIds.length
        ? this.prisma.endpoint.findMany({ where: { id: { in: endpointIds } } })
        : Promise.resolve([]),
    ]);

    return {
      journeyId,
      requirementIds: journey?.requirementIds ?? [],
      uiFlows: flowMappings.map(m => {
        const f = flows.find(x => x.id === m.flowId);
        return { id: m.flowId, name: f?.name ?? m.flowId };
      }),
      endpoints: endpointMappings.map(m => {
        const e = endpoints.find(x => x.id === m.discoveredEndpointId);
        return { id: m.discoveredEndpointId, method: e?.method ?? '?', path: e?.path ?? m.discoveredEndpointId };
      }),
    };
  }

  // ─── Full version mapping summary ────────────────────────────────────────────

  async getVersionMappingSummary(projectId: string, rtmVersionId: string) {
    const [reqFlows, reqEndpoints, jFlows, jEndpoints, version] = await Promise.all([
      this.prisma.rtmReqFlowMapping.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmReqEndpointMapping.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmJourneyFlowMapping.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmJourneyEndpointMapping.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmVersion.findUnique({
        where: { id: rtmVersionId },
        include: { requirements: true, journeys: true },
      }),
    ]);

    const requirements = version?.requirements ?? [];
    const journeys = version?.journeys ?? [];

    return {
      requirementCount: requirements.length,
      journeyCount: journeys.length,
      requirementFlowMappings: reqFlows.length,
      requirementEndpointMappings: reqEndpoints.length,
      journeyFlowMappings: jFlows.length,
      journeyEndpointMappings: jEndpoints.length,
      unmappedRequirements: requirements.filter(r =>
        !reqFlows.some(m => m.requirementId === r.id) &&
        !reqEndpoints.some(m => m.requirementId === r.id)
      ).map(r => ({ id: r.id, key: r.key, title: r.title })),
    };
  }

  // ─── AI-assisted suggestions ──────────────────────────────────────────────────

  async suggestForRequirement(projectId: string, requirementId: string) {
    const [req, flows, endpoints] = await Promise.all([
      this.prisma.rtmRequirement.findUnique({ where: { id: requirementId } }),
      this.prisma.flow.findMany({ where: { projectId } }),
      this.prisma.endpoint.findMany({ where: { projectId } }),
    ]);

    if (!req) throw new NotFoundException('Requirement not found');
    const query = `${req.title} ${req.description}`;

    const suggestedFlows = flows
      .map(f => ({ ...f, score: wordScore(query, f.name) }))
      .filter(f => f.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(f => ({
        id: f.id, name: f.name,
        score: Math.round(f.score * 100),
        createdAt: f.createdAt.toISOString(),
      }));

    const suggestedEndpoints = endpoints
      .map(e => ({ ...e, score: wordScore(query, `${e.method} ${e.path}`) }))
      .filter(e => e.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(e => ({
        id: e.id, method: e.method, path: e.path,
        score: Math.round(e.score * 100),
        createdAt: e.createdAt.toISOString(),
      }));

    return { suggestedFlows, suggestedEndpoints };
  }

  async suggestForJourney(projectId: string, journeyId: string) {
    const [journey, flows, endpoints] = await Promise.all([
      this.prisma.rtmJourney.findUnique({ where: { id: journeyId } }),
      this.prisma.flow.findMany({ where: { projectId } }),
      this.prisma.endpoint.findMany({ where: { projectId } }),
    ]);

    if (!journey) throw new NotFoundException('Journey not found');
    const query = `${journey.name} ${journey.description}`;

    const suggestedFlows = flows
      .map(f => ({ ...f, score: wordScore(query, f.name) }))
      .filter(f => f.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(f => ({
        id: f.id, name: f.name,
        score: Math.round(f.score * 100),
        createdAt: f.createdAt.toISOString(),
      }));

    const suggestedEndpoints = endpoints
      .map(e => ({ ...e, score: wordScore(query, `${e.method} ${e.path}`) }))
      .filter(e => e.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(e => ({
        id: e.id, method: e.method, path: e.path,
        score: Math.round(e.score * 100),
        createdAt: e.createdAt.toISOString(),
      }));

    return { suggestedFlows, suggestedEndpoints };
  }
}
