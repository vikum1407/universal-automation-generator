import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { computeRequirementGap } from './calculators/requirement-gap-calculator';
import { computeEndpointGap }    from './calculators/endpoint-gap-calculator';
import { computeJourneyGap }     from './calculators/journey-gap-calculator';
import { buildGenerationPlan }   from './planner/generation-plan-builder';
import type { RequirementGap }   from './entities/requirement-gap.entity';
import type { EndpointGap }      from './entities/endpoint-gap.entity';
import type { JourneyGap, GapSummary } from './entities/journey-gap.entity';
import { computeRiskWeightedScore } from '../coverage/calculators/risk-weighted-coverage-calculator';

@Injectable()
export class CoverageGapService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Full recompute ───────────────────────────────────────────────────────────

  async recomputeGaps(projectId: string, rtmVersionId: string): Promise<void> {
    const version = await this.prisma.rtmVersion.findUnique({
      where:   { id: rtmVersionId },
      include: { requirements: true, endpoints: true, journeys: true },
    });
    if (!version) throw new Error('RTM version not found');

    // ── Load all test tags ──────────────────────────────────────────────────────
    const allTags = await this.prisma.rtmTestTag.findMany({ where: { projectId } });

    const testIdsFor = (tagType: string, tagValue: string): Set<string> =>
      new Set(allTags.filter(t => t.tagType === tagType && t.tagValue === tagValue).map(t => t.testId));

    // ── Load Phase 2 mappings ───────────────────────────────────────────────────
    const [reqFlowMaps, reqEpMaps, journeyFlowMaps, journeyEpMaps] = await Promise.all([
      this.prisma.rtmReqFlowMapping.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmReqEndpointMapping.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmJourneyFlowMapping.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmJourneyEndpointMapping.findMany({ where: { rtmVersionId } }),
    ]);

    // ── Load Phase 3 coverage snapshots ────────────────────────────────────────
    const [reqCovs, epCovs, jCovs] = await Promise.all([
      this.prisma.rtmRequirementCoverage.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmEndpointCoverage.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmJourneyCoverage.findMany({ where: { rtmVersionId } }),
    ]);

    const reqCovMap  = new Map(reqCovs.map(r => [r.requirementId, r]));
    const epCovMap   = new Map(epCovs.map(e => [e.endpointId, e]));
    const jCovMap    = new Map(jCovs.map(j => [j.journeyId, j]));

    const now = new Date();

    // ── Requirements ───────────────────────────────────────────────────────────
    for (const req of version.requirements) {
      const cov = reqCovMap.get(req.id);
      const flowMaps = reqFlowMaps.filter(m => m.requirementId === req.id);
      const epMaps   = reqEpMaps.filter(m => m.requirementId === req.id);

      // Build classified test sets
      const directIds   = testIdsFor('requirement', req.id);
      const uiTestIds   = new Set([
        ...directIds,
        ...flowMaps.flatMap(m => [...testIdsFor('uiflow', m.flowId)]),
      ].filter(id => !/api|request|http|fetch|xhr/i.test(id)));
      const apiTestIds  = new Set([
        ...epMaps.flatMap(m => [...testIdsFor('endpoint', m.discoveredEndpointId)]),
      ]);
      const hybridTestIds = new Set(
        [...directIds].filter(id => uiTestIds.has(id) && apiTestIds.has(id))
      );
      const allTestIds = new Set([...directIds, ...uiTestIds, ...apiTestIds]);

      const coverageScore    = cov?.coverageScore    ?? 0;
      const riskWeightedScore = computeRiskWeightedScore(coverageScore, req.risk as any);

      const result = computeRequirementGap({
        requirementId:    req.id,
        risk:             req.risk,
        priority:         req.priority,
        coverageScore,
        riskWeightedScore,
        totalTests:       cov?.totalTests ?? 0,
        uiFlowsTotal:     flowMaps.length,
        endpointsTotal:   epMaps.length,
        uiTestIds,
        apiTestIds,
        hybridTestIds,
        allTestIds,
      });

      await this.prisma.requirementGap.upsert({
        where:  { rtmVersionId_requirementId: { rtmVersionId, requirementId: req.id } },
        update: { ...result, coverageScore, riskWeightedScore, risk: req.risk, priority: req.priority, lastComputedAt: now },
        create: { projectId, rtmVersionId, requirementId: req.id, ...result, coverageScore, riskWeightedScore, risk: req.risk, priority: req.priority, lastComputedAt: now },
      });
    }

    // ── Endpoints ──────────────────────────────────────────────────────────────
    for (const ep of version.endpoints) {
      const cov     = epCovMap.get(ep.id);
      const testIds = testIdsFor('endpoint', ep.id);

      const result = computeEndpointGap({
        endpointId:    ep.id,
        coverageScore: cov?.coverageScore ?? 0,
        testIds,
      });

      await this.prisma.endpointGap.upsert({
        where:  { rtmVersionId_endpointId: { rtmVersionId, endpointId: ep.id } },
        update: { ...result, coverageScore: cov?.coverageScore ?? 0, lastComputedAt: now },
        create: { projectId, rtmVersionId, endpointId: ep.id, ...result, coverageScore: cov?.coverageScore ?? 0, lastComputedAt: now },
      });
    }

    // ── Journeys ───────────────────────────────────────────────────────────────
    for (const journey of version.journeys) {
      const cov = jCovMap.get(journey.id);

      // All tests for this journey: direct tags + mapped flows/endpoints
      const flowMapsJ = journeyFlowMaps.filter(m => m.journeyId === journey.id);
      const epMapsJ   = journeyEpMaps.filter(m => m.journeyId === journey.id);
      const testIds   = new Set([
        ...testIdsFor('journey', journey.id),
        ...flowMapsJ.flatMap(m => [...testIdsFor('uiflow', m.flowId)]),
        ...epMapsJ.flatMap(m   => [...testIdsFor('endpoint', m.discoveredEndpointId)]),
      ]);

      const result = computeJourneyGap({
        journeyId:     journey.id,
        coverageScore: cov?.coverageScore ?? 0,
        testIds,
      });

      await this.prisma.journeyGap.upsert({
        where:  { rtmVersionId_journeyId: { rtmVersionId, journeyId: journey.id } },
        update: { ...result, coverageScore: cov?.coverageScore ?? 0, lastComputedAt: now },
        create: { projectId, rtmVersionId, journeyId: journey.id, ...result, coverageScore: cov?.coverageScore ?? 0, lastComputedAt: now },
      });
    }
  }

  // ─── Query: summary ───────────────────────────────────────────────────────────

  async getSummary(projectId: string, rtmVersionId: string): Promise<GapSummary> {
    const [reqGaps, epGaps, jGaps] = await Promise.all([
      this.prisma.requirementGap.findMany({ where: { rtmVersionId } }),
      this.prisma.endpointGap.findMany({ where: { rtmVersionId } }),
      this.prisma.journeyGap.findMany({ where: { rtmVersionId } }),
    ]);

    const lastRaw = reqGaps.reduce<Date | null>((acc, g) => {
      return !acc || g.lastComputedAt > acc ? g.lastComputedAt : acc;
    }, null);

    return {
      projectId, rtmVersionId,
      requirementsTotal:        reqGaps.length,
      requirementsNoTests:      reqGaps.filter(g => g.hasNoTests).length,
      requirementsInsufficient: reqGaps.filter(g => g.hasInsufficientTests).length,
      requirementsHighRiskGap:  reqGaps.filter(g => (g.risk === 'high' || g.risk === 'critical') && (g.hasNoTests || g.hasInsufficientTests)).length,
      endpointsTotal:           epGaps.length,
      endpointsNoTests:         epGaps.filter(g => g.hasNoTests).length,
      endpointsInsufficient:    epGaps.filter(g => g.hasInsufficientTests).length,
      journeysTotal:            jGaps.length,
      journeysNoTests:          jGaps.filter(g => g.hasNoTests).length,
      journeysInsufficient:     jGaps.filter(g => g.hasInsufficientTests).length,
      lastComputedAt:           lastRaw ? lastRaw.toISOString() : null,
    };
  }

  // ─── Query: requirement gaps ──────────────────────────────────────────────────

  async getRequirementGaps(projectId: string, rtmVersionId: string): Promise<RequirementGap[]> {
    const rows = await this.prisma.requirementGap.findMany({
      where:   { rtmVersionId },
      orderBy: [{ risk: 'desc' }, { coverageScore: 'asc' }],
    });

    // Enrich with requirement key/title
    const reqIds = rows.map(r => r.requirementId);
    const reqs   = await this.prisma.rtmRequirement.findMany({ where: { id: { in: reqIds } } });
    const reqMap = new Map(reqs.map(r => [r.id, r]));

    return rows.map(r => ({
      ...r,
      lastComputedAt:   r.lastComputedAt.toISOString(),
      requirementKey:   reqMap.get(r.requirementId)?.key,
      requirementTitle: reqMap.get(r.requirementId)?.title,
    }));
  }

  // ─── Query: endpoint gaps ─────────────────────────────────────────────────────

  async getEndpointGaps(projectId: string, rtmVersionId: string): Promise<EndpointGap[]> {
    const rows = await this.prisma.endpointGap.findMany({
      where:   { rtmVersionId },
      orderBy: [{ coverageScore: 'asc' }],
    });

    // Enrich from RtmEndpoint
    const epIds = rows.map(r => r.endpointId);
    const eps   = await this.prisma.rtmEndpoint.findMany({ where: { id: { in: epIds } } });
    const epMap = new Map(eps.map(e => [e.id, e]));

    return rows.map(r => ({
      ...r,
      lastComputedAt: r.lastComputedAt.toISOString(),
      endpointKey:    epMap.get(r.endpointId)?.key,
      method:         epMap.get(r.endpointId)?.method,
      path:           epMap.get(r.endpointId)?.path,
    }));
  }

  // ─── Query: journey gaps ──────────────────────────────────────────────────────

  async getJourneyGaps(projectId: string, rtmVersionId: string): Promise<JourneyGap[]> {
    const rows = await this.prisma.journeyGap.findMany({
      where:   { rtmVersionId },
      orderBy: [{ coverageScore: 'asc' }],
    });

    const jIds = rows.map(r => r.journeyId);
    const jrns = await this.prisma.rtmJourney.findMany({ where: { id: { in: jIds } } });
    const jMap = new Map(jrns.map(j => [j.id, j]));

    return rows.map(r => ({
      ...r,
      lastComputedAt: r.lastComputedAt.toISOString(),
      journeyKey:     jMap.get(r.journeyId)?.key,
      journeyName:    jMap.get(r.journeyId)?.name,
    }));
  }

  // ─── Query: generation plan ───────────────────────────────────────────────────

  async getGenerationPlan(projectId: string, rtmVersionId: string) {
    const [reqGaps, epGaps, jGaps] = await Promise.all([
      this.getRequirementGaps(projectId, rtmVersionId),
      this.getEndpointGaps(projectId, rtmVersionId),
      this.getJourneyGaps(projectId, rtmVersionId),
    ]);
    return buildGenerationPlan(projectId, rtmVersionId, reqGaps, epGaps, jGaps);
  }
}
