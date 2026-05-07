import * as fs   from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  computeRequirementCoverageScore,
  type TestStats, type MappingCounts,
} from './calculators/requirement-coverage-calculator';
import { computeEndpointCoverageScore }    from './calculators/endpoint-coverage-calculator';
import { computeJourneyCoverageScore }     from './calculators/journey-coverage-calculator';
import { computeRiskWeightedScore, aggregateRiskWeightedScore } from './calculators/risk-weighted-coverage-calculator';
import type { RequirementCoverage }  from './entities/requirement-coverage.entity';
import type { EndpointCoverage }     from './entities/endpoint-coverage.entity';
import type { JourneyCoverage, RTMCoverageSummary } from './entities/journey-coverage.entity';

const OUTPUT_BASE = './qlitz-output';

// ─── Spec-file tag scanner ────────────────────────────────────────────────────
// Reads spec files and extracts inline RTM annotations:
//   // @rtm-req  <requirementId>
//   // @rtm-flow <flowId>
//   // @rtm-endpoint <endpointId>
//   // @rtm-journey  <journeyId>
interface ScannedTag { testId: string; tagType: string; tagValue: string }

function scanSpecFilesForTags(projectId: string): ScannedTag[] {
  const base = path.join(OUTPUT_BASE, projectId);
  const dirs = [base, path.join(base, 'tests')];
  const tags: ScannedTag[] = [];
  const patterns: [RegExp, string][] = [
    [/@rtm-req\s+(\S+)/g,      'requirement'],
    [/@rtm-flow\s+(\S+)/g,     'uiflow'],
    [/@rtm-endpoint\s+(\S+)/g, 'endpoint'],
    [/@rtm-journey\s+(\S+)/g,  'journey'],
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.spec.ts'))) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      for (const [re, tagType] of patterns) {
        re.lastIndex = 0;
        for (const m of content.matchAll(re)) {
          tags.push({ testId: file, tagType, tagValue: m[1] });
        }
      }
    }
  }
  return tags;
}

// Load last execution results from test-results.json
function loadTestResults(projectId: string): Map<string, 'passed' | 'failed' | 'skipped'> {
  const file = path.join(OUTPUT_BASE, projectId, 'test-results.json');
  if (!fs.existsSync(file)) return new Map();
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const m = new Map<string, 'passed' | 'failed' | 'skipped'>();
    // Common shapes: array of { file, status } or { results: [...] }
    const rows: any[] = Array.isArray(raw) ? raw : (raw.results ?? raw.tests ?? []);
    for (const r of rows) {
      const id = r.file ?? r.testId ?? r.name ?? r.id;
      const status = r.status ?? (r.passed ? 'passed' : r.failed ? 'failed' : 'skipped');
      if (id) m.set(String(id), status);
    }
    return m;
  } catch {
    return new Map();
  }
}

@Injectable()
export class RtmCoverageService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Tag management ───────────────────────────────────────────────────────────

  async addTag(projectId: string, testId: string, tagType: string, tagValue: string) {
    return this.prisma.rtmTestTag.create({ data: { projectId, testId, tagType, tagValue } });
  }

  async removeTag(tagId: string) {
    await this.prisma.rtmTestTag.delete({ where: { id: tagId } });
  }

  async listTags(projectId: string) {
    return this.prisma.rtmTestTag.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } });
  }

  // ─── Full recompute ───────────────────────────────────────────────────────────

  async recompute(projectId: string, rtmVersionId: string): Promise<void> {
    // 1. Load the RTM version
    const version = await this.prisma.rtmVersion.findUnique({
      where: { id: rtmVersionId },
      include: { requirements: true, endpoints: true, journeys: true },
    });
    if (!version) throw new Error('RTM version not found');

    // 2. Load all tags (DB + spec file scan merged)
    const dbTags = await this.prisma.rtmTestTag.findMany({ where: { projectId } });
    const fsTags = scanSpecFilesForTags(projectId);
    const allTags = [...dbTags.map(t => ({ testId: t.testId, tagType: t.tagType, tagValue: t.tagValue })), ...fsTags];

    // 3. Load execution results
    const execResults = loadTestResults(projectId);

    // 4. Load all Phase-2 mappings for this version
    const [reqFlowMaps, reqEndpointMaps, journeyFlowMaps, journeyEndpointMaps] = await Promise.all([
      this.prisma.rtmReqFlowMapping.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmReqEndpointMapping.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmJourneyFlowMapping.findMany({ where: { rtmVersionId } }),
      this.prisma.rtmJourneyEndpointMapping.findMany({ where: { rtmVersionId } }),
    ]);

    // Helper: get test IDs matching a tag
    const testIdsFor = (tagType: string, tagValue: string): Set<string> =>
      new Set(allTags.filter(t => t.tagType === tagType && t.tagValue === tagValue).map(t => t.testId));

    const statsFor = (testIds: Set<string>): TestStats => {
      let passed = 0, failed = 0, skipped = 0;
      for (const id of testIds) {
        const s = execResults.get(id);
        if (s === 'passed') passed++;
        else if (s === 'failed') failed++;
        else skipped++;
      }
      return { totalTests: testIds.size, passedTests: passed, failedTests: failed, skippedTests: skipped };
    };

    // ── Requirements ──
    const reqCoverages: any[] = [];
    for (const req of version.requirements) {
      // Gather all test IDs for this requirement (direct tags + mapped flow/endpoint/journey tags)
      const directIds   = testIdsFor('requirement', req.id);
      const flowMaps    = reqFlowMaps.filter(m => m.requirementId === req.id);
      const epMaps      = reqEndpointMaps.filter(m => m.requirementId === req.id);
      const journeys    = version.journeys.filter(j => j.requirementIds.includes(req.id));

      const flowIds     = new Set(flowMaps.flatMap(m => [...testIdsFor('uiflow', m.flowId)]));
      const epIds       = new Set(epMaps.flatMap(m => [...testIdsFor('endpoint', m.discoveredEndpointId)]));
      const journeyIds  = new Set(journeys.flatMap(j => [...testIdsFor('journey', j.id)]));

      const allTestIds  = new Set([...directIds, ...flowIds, ...epIds, ...journeyIds]);
      const stats       = statsFor(allTestIds);

      // Dimension coverage
      const uiFlowsTotal    = flowMaps.length;
      const uiFlowsCovered  = flowMaps.filter(m => testIdsFor('uiflow', m.flowId).size > 0).length;
      const endpointsTotal  = epMaps.length;
      const endpointsCovered = epMaps.filter(m => testIdsFor('endpoint', m.discoveredEndpointId).size > 0).length;
      const journeysTotal   = journeys.length;
      const journeysCovered = journeys.filter(j => testIdsFor('journey', j.id).size > 0).length;

      const mappings: MappingCounts = {
        uiFlowsTotal, uiFlowsCovered, endpointsTotal, endpointsCovered, journeysTotal, journeysCovered,
      };

      const coverageScore     = computeRequirementCoverageScore(stats, mappings);
      const riskWeightedScore = computeRiskWeightedScore(coverageScore, req.risk);

      reqCoverages.push({
        projectId, rtmVersionId, requirementId: req.id,
        hasTests: allTestIds.size > 0,
        totalTests:   stats.totalTests,
        passedTests:  stats.passedTests,
        failedTests:  stats.failedTests,
        skippedTests: stats.skippedTests,
        uiFlowsTotal, uiFlowsCovered, endpointsTotal, endpointsCovered, journeysTotal, journeysCovered,
        coverageScore, riskWeightedScore,
        lastComputedAt: new Date(),
      });
    }

    // ── Endpoints ──
    const epCoverages: any[] = [];
    for (const ep of version.endpoints) {
      const testIds    = testIdsFor('endpoint', ep.id);
      const stats      = statsFor(testIds);
      const coverageScore = computeEndpointCoverageScore(stats);
      epCoverages.push({
        projectId, rtmVersionId, endpointId: ep.id,
        totalTests: stats.totalTests, passedTests: stats.passedTests, failedTests: stats.failedTests,
        coverageScore, lastComputedAt: new Date(),
      });
    }

    // ── Journeys ──
    const journeyCoverages: any[] = [];
    for (const j of version.journeys) {
      const directIds = testIdsFor('journey', j.id);
      // Also gather tests from mapped flows/endpoints
      const jFlowMaps = journeyFlowMaps.filter(m => m.journeyId === j.id);
      const jEpMaps   = journeyEndpointMaps.filter(m => m.journeyId === j.id);
      const flowTestIds = new Set(jFlowMaps.flatMap(m => [...testIdsFor('uiflow', m.flowId)]));
      const epTestIds   = new Set(jEpMaps.flatMap(m => [...testIdsFor('endpoint', m.discoveredEndpointId)]));
      const allTestIds  = new Set([...directIds, ...flowTestIds, ...epTestIds]);
      const stats       = statsFor(allTestIds);
      const coverageScore = computeJourneyCoverageScore(stats);
      journeyCoverages.push({
        projectId, rtmVersionId, journeyId: j.id,
        totalTests: stats.totalTests, passedTests: stats.passedTests, failedTests: stats.failedTests,
        coverageScore, lastComputedAt: new Date(),
      });
    }

    // ── Upsert all ──
    await Promise.all([
      ...reqCoverages.map(r =>
        this.prisma.rtmRequirementCoverage.upsert({
          where: { rtmVersionId_requirementId: { rtmVersionId: r.rtmVersionId, requirementId: r.requirementId } },
          create: r, update: r,
        })
      ),
      ...epCoverages.map(e =>
        this.prisma.rtmEndpointCoverage.upsert({
          where: { rtmVersionId_endpointId: { rtmVersionId: e.rtmVersionId, endpointId: e.endpointId } },
          create: e, update: e,
        })
      ),
      ...journeyCoverages.map(j =>
        this.prisma.rtmJourneyCoverage.upsert({
          where: { rtmVersionId_journeyId: { rtmVersionId: j.rtmVersionId, journeyId: j.journeyId } },
          create: j, update: j,
        })
      ),
    ]);
  }

  // ─── Query APIs ───────────────────────────────────────────────────────────────

  async getSummary(projectId: string, rtmVersionId: string, frameworkId?: string): Promise<RTMCoverageSummary> {
    const fwFilter = frameworkId ? { frameworkId } : {};
    const [reqCov, epCov, jCov, version] = await Promise.all([
      this.prisma.rtmRequirementCoverage.findMany({ where: { rtmVersionId, ...fwFilter } }),
      this.prisma.rtmEndpointCoverage.findMany({ where: { rtmVersionId, ...fwFilter } }),
      this.prisma.rtmJourneyCoverage.findMany({ where: { rtmVersionId, ...fwFilter } }),
      this.prisma.rtmVersion.findUnique({
        where: { id: rtmVersionId },
        include: { requirements: true, endpoints: true, journeys: true },
      }),
    ]);

    const requirementsTotal    = version?.requirements.length ?? 0;
    const requirementsCovered  = reqCov.filter(r => r.coverageScore > 0).length;
    const endpointsTotal       = version?.endpoints.length ?? 0;
    const endpointsCovered     = epCov.filter(e => e.coverageScore > 0).length;
    const journeysTotal        = version?.journeys.length ?? 0;
    const journeysCovered      = jCov.filter(j => j.coverageScore > 0).length;

    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

    const riskWeightedCoverageScore = reqCov.length > 0
      ? Math.round(aggregateRiskWeightedScore(
          reqCov.map(r => ({ coverageScore: r.coverageScore, risk: 'medium' }))
        ) * 100)
      : 0;

    const lastComputedAt = reqCov.reduce<Date | null>((latest, r) => {
      const d = r.lastComputedAt;
      return !latest || d > latest ? d : latest;
    }, null);

    return {
      projectId, rtmVersionId,
      requirementsTotal, requirementsCovered,
      requirementsCoveragePercent: pct(requirementsCovered, requirementsTotal),
      endpointsTotal, endpointsCovered,
      endpointsCoveragePercent: pct(endpointsCovered, endpointsTotal),
      journeysTotal, journeysCovered,
      journeysCoveragePercent: pct(journeysCovered, journeysTotal),
      riskWeightedCoverageScore,
      lastComputedAt: lastComputedAt?.toISOString() ?? null,
    };
  }

  async getRequirementCoverages(projectId: string, rtmVersionId: string, frameworkId?: string): Promise<RequirementCoverage[]> {
    const fwFilter = frameworkId ? { frameworkId } : {};
    const [rows, version] = await Promise.all([
      this.prisma.rtmRequirementCoverage.findMany({ where: { rtmVersionId, ...fwFilter }, orderBy: { coverageScore: 'asc' } }),
      this.prisma.rtmVersion.findUnique({ where: { id: rtmVersionId }, include: { requirements: true } }),
    ]);
    const reqMap = new Map((version?.requirements ?? []).map(r => [r.id, r]));
    return rows.map(r => ({
      ...r,
      lastComputedAt:     r.lastComputedAt.toISOString(),
      requirementKey:     reqMap.get(r.requirementId)?.key,
      requirementTitle:   reqMap.get(r.requirementId)?.title,
      risk:               reqMap.get(r.requirementId)?.risk,
      priority:           reqMap.get(r.requirementId)?.priority,
    }));
  }

  async getRequirementCoverage(projectId: string, rtmVersionId: string, requirementId: string): Promise<RequirementCoverage | null> {
    const [row, req] = await Promise.all([
      this.prisma.rtmRequirementCoverage.findUnique({
        where: { rtmVersionId_requirementId: { rtmVersionId, requirementId } },
      }),
      this.prisma.rtmRequirement.findUnique({ where: { id: requirementId } }),
    ]);
    if (!row) return null;
    return {
      ...row,
      lastComputedAt:   row.lastComputedAt.toISOString(),
      requirementKey:   req?.key,
      requirementTitle: req?.title,
      risk:             req?.risk,
      priority:         req?.priority,
    };
  }

  async getEndpointCoverages(projectId: string, rtmVersionId: string, frameworkId?: string): Promise<EndpointCoverage[]> {
    const fwFilter = frameworkId ? { frameworkId } : {};
    const [rows, version] = await Promise.all([
      this.prisma.rtmEndpointCoverage.findMany({ where: { rtmVersionId, ...fwFilter }, orderBy: { coverageScore: 'asc' } }),
      this.prisma.rtmVersion.findUnique({ where: { id: rtmVersionId }, include: { endpoints: true } }),
    ]);
    const epMap = new Map((version?.endpoints ?? []).map(e => [e.id, e]));
    return rows.map(r => ({
      ...r,
      lastComputedAt: r.lastComputedAt.toISOString(),
      endpointKey:    epMap.get(r.endpointId)?.key,
      method:         epMap.get(r.endpointId)?.method,
      path:           epMap.get(r.endpointId)?.path,
    }));
  }

  async getJourneyCoverages(projectId: string, rtmVersionId: string, frameworkId?: string): Promise<JourneyCoverage[]> {
    const fwFilter = frameworkId ? { frameworkId } : {};
    const [rows, version] = await Promise.all([
      this.prisma.rtmJourneyCoverage.findMany({ where: { rtmVersionId, ...fwFilter }, orderBy: { coverageScore: 'asc' } }),
      this.prisma.rtmVersion.findUnique({ where: { id: rtmVersionId }, include: { journeys: true } }),
    ]);
    const jMap = new Map((version?.journeys ?? []).map(j => [j.id, j]));
    return rows.map(r => ({
      ...r,
      lastComputedAt: r.lastComputedAt.toISOString(),
      journeyKey:     jMap.get(r.journeyId)?.key,
      journeyName:    jMap.get(r.journeyId)?.name,
    }));
  }
}
