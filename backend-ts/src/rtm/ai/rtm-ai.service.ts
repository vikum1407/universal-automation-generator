import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AIClient } from '../../framework/ai/ai-client';
import { AIRequirementExtractor, type ExtractedRequirement } from './ai-requirement-extractor';
import { AIRequirementClusterer, type RequirementCluster } from './ai-requirement-clusterer';
import { AIRequirementRewriter, type RewriteMode, type RewriteResult } from './ai-requirement-rewriter';
import { AIRiskScorer, type RiskScore } from './ai-risk-scorer';

@Injectable()
export class RtmAIService {
  constructor(
    private readonly prisma:     PrismaService,
    private readonly extractor:  AIRequirementExtractor,
    private readonly clusterer:  AIRequirementClusterer,
    private readonly rewriter:   AIRequirementRewriter,
    private readonly riskScorer: AIRiskScorer,
  ) {}

  // ─── Extract requirements from free-text and import into RTM version ──────

  async extractAndImport(
    projectId:    string,
    rtmVersionId: string,
    content:      string,
  ): Promise<{ extracted: number; requirements: ExtractedRequirement[] }> {
    await this.requireVersion(rtmVersionId);

    const extracted = await this.extractor.extract(content);

    // Build a key prefix from highest existing key number in this version
    const existing = await this.prisma.rtmRequirement.findMany({
      where: { rtmVersionId },
      select: { key: true },
      orderBy: { createdAt: 'asc' },
    });
    const maxNum = existing.reduce((max, r) => {
      const n = parseInt(r.key.replace(/\D/g, ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);

    await this.prisma.rtmRequirement.createMany({
      data: extracted.map((e, i) => ({
        rtmVersionId,
        key:         `REQ-${maxNum + i + 1}`,
        title:       e.title,
        description: e.description,
        type:        e.type === 'nonFunctional' ? 'nonFunctional' : 'functional',
        priority:    (e.priority as any) ?? 'P2',
        risk:        (e.risk as any) ?? 'medium',
        status:      'draft',
        tags:        e.acceptanceCriteria?.map((_, idx) => `ac-${idx + 1}`) ?? [],
      })),
    });

    return { extracted: extracted.length, requirements: extracted };
  }

  // ─── Cluster all requirements in a version ────────────────────────────────

  async clusterRequirements(
    projectId:    string,
    rtmVersionId: string,
  ): Promise<RequirementCluster[]> {
    await this.requireVersion(rtmVersionId);

    const reqs = await this.prisma.rtmRequirement.findMany({
      where: { rtmVersionId },
      select: { id: true, key: true, title: true, description: true },
    });

    return this.clusterer.cluster(reqs.map(r => ({
      id:          r.id,
      key:         r.key,
      title:       r.title,
      description: r.description,
    })));
  }

  // ─── Rewrite a single requirement ────────────────────────────────────────

  async rewriteRequirement(
    projectId:     string,
    rtmVersionId:  string,
    requirementId: string,
    mode:          RewriteMode,
  ): Promise<RewriteResult> {
    const req = await this.prisma.rtmRequirement.findUnique({ where: { id: requirementId } });
    if (!req) throw new NotFoundException(`Requirement ${requirementId} not found`);

    return this.rewriter.rewrite(requirementId, req.title, req.description, mode);
  }

  // ─── Accept a rewrite and persist it ─────────────────────────────────────

  async acceptRewrite(
    requirementId:      string,
    improvedTitle:      string,
    improvedDescription: string,
  ) {
    return this.prisma.rtmRequirement.update({
      where: { id: requirementId },
      data: { title: improvedTitle, description: improvedDescription },
    });
  }

  // ─── Score risk for a set of requirements ────────────────────────────────

  async scoreRisk(
    projectId:      string,
    rtmVersionId:   string,
    requirementIds: string[],
  ): Promise<RiskScore[]> {
    await this.requireVersion(rtmVersionId);

    const reqs = await this.prisma.rtmRequirement.findMany({
      where: { id: { in: requirementIds }, rtmVersionId },
      select: { id: true, key: true, title: true, description: true, risk: true },
    });

    // Enrich with coverage data
    const coverages = await this.prisma.rtmRequirementCoverage.findMany({
      where: { rtmVersionId, requirementId: { in: requirementIds } },
      select: { requirementId: true, coverageScore: true, totalTests: true },
    });
    const covMap = new Map(coverages.map(c => [c.requirementId, c]));

    const slim = reqs.map(r => {
      const cov = covMap.get(r.id);
      return {
        id:            r.id,
        key:           r.key,
        title:         r.title,
        description:   r.description,
        currentRisk:   r.risk,
        totalTests:    cov?.totalTests ?? 0,
        coverageScore: cov?.coverageScore ?? 0,
        hasNoTests:    (cov?.totalTests ?? 0) === 0,
      };
    });

    const scores = await this.riskScorer.scoreRequirements(slim);

    // Persist updated risk levels
    await Promise.all(
      scores.map(s =>
        this.prisma.rtmRequirement.update({
          where: { id: s.requirementId },
          data: { risk: s.risk as any },
        }).catch(() => {}),
      ),
    );

    return scores;
  }

  // ─── Score risk for ALL requirements in version ───────────────────────────

  async scoreAllRisk(projectId: string, rtmVersionId: string): Promise<RiskScore[]> {
    await this.requireVersion(rtmVersionId);
    const reqs = await this.prisma.rtmRequirement.findMany({
      where: { rtmVersionId },
      select: { id: true },
    });
    return this.scoreRisk(projectId, rtmVersionId, reqs.map(r => r.id));
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async requireVersion(rtmVersionId: string) {
    const v = await this.prisma.rtmVersion.findUnique({ where: { id: rtmVersionId } });
    if (!v) throw new NotFoundException(`RTM version ${rtmVersionId} not found`);
  }
}
