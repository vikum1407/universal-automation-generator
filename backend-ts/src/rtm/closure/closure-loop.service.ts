import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService }            from '../../../prisma/prisma.service';
import { RtmCoverageService }       from '../coverage/rtm-coverage.service';
import { CoverageGapService }       from '../gaps/coverage-gap.service';
import { RtmTestGenerationService } from '../generation/rtm-test-generation.service';
import type { StartClosureJobDto, ClosureJob } from './entities/closure-job.entity';
import type { ClosureIteration, CoverageSummarySnapshot } from './entities/closure-iteration.entity';
import {
  coverageTargetsMet, resolveGenStrategy,
  type ClosureStrategy,
} from './planner/closure-strategy';
import type { RTMCoverageSummary } from '../coverage/entities/journey-coverage.entity';

@Injectable()
export class ClosureLoopService {
  private readonly logger = new Logger(ClosureLoopService.name);
  private readonly cancelledJobs = new Set<string>();

  constructor(
    private readonly prisma:      PrismaService,
    private readonly coverage:    RtmCoverageService,
    private readonly gaps:        CoverageGapService,
    private readonly generation:  RtmTestGenerationService,
  ) {}

  // ─── Start a closure job ──────────────────────────────────────────────────────

  async startClosureJob(
    projectId:    string,
    rtmVersionId: string,
    dto:          StartClosureJobDto,
  ): Promise<ClosureJob> {
    const version = await this.prisma.rtmVersion.findUnique({ where: { id: rtmVersionId } });
    if (!version) throw new NotFoundException('RTM version not found');

    const job = await this.prisma.closureJob.create({
      data: {
        projectId,
        rtmVersionId,
        framework:                 dto.framework,
        language:                  dto.language,
        baseUrl:                   dto.baseUrl,
        targetRequirementCoverage: dto.targetRequirementCoverage,
        targetEndpointCoverage:    dto.targetEndpointCoverage  ?? null,
        targetJourneyCoverage:     dto.targetJourneyCoverage   ?? null,
        maxIterations:             dto.maxIterations,
        maxTestsPerIteration:      dto.maxTestsPerIteration,
        prioritizeHighRisk:        dto.prioritizeHighRisk,
        dryRun:                    dto.dryRun,
        status:                    'running',
      },
    });

    // Fire-and-forget background loop
    this.runLoop(job.id).catch(err =>
      this.logger.error(`Closure loop ${job.id} failed: ${err.message}`),
    );

    return this.mapJob(job);
  }

  // ─── Query APIs ───────────────────────────────────────────────────────────────

  async getJob(jobId: string): Promise<ClosureJob> {
    const job = await this.prisma.closureJob.findUnique({
      where:   { id: jobId },
      include: { iterations: { orderBy: { iterationNumber: 'asc' } } },
    });
    if (!job) throw new NotFoundException('Closure job not found');
    return this.mapJob(job);
  }

  async listJobs(projectId: string, rtmVersionId: string): Promise<ClosureJob[]> {
    const rows = await this.prisma.closureJob.findMany({
      where:   { projectId, rtmVersionId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(j => this.mapJob(j));
  }

  async cancelJob(jobId: string): Promise<void> {
    this.cancelledJobs.add(jobId);
    await this.prisma.closureJob.update({
      where: { id: jobId },
      data:  { status: 'cancelled', completedAt: new Date() },
    });
  }

  async getIterations(jobId: string): Promise<ClosureIteration[]> {
    const rows = await this.prisma.closureIteration.findMany({
      where:   { closureJobId: jobId },
      orderBy: { iterationNumber: 'asc' },
    });
    return rows.map(r => this.mapIteration(r));
  }

  async getIteration(jobId: string, iterationNumber: number): Promise<ClosureIteration> {
    const row = await this.prisma.closureIteration.findUnique({
      where: { closureJobId_iterationNumber: { closureJobId: jobId, iterationNumber } },
    });
    if (!row) throw new NotFoundException('Iteration not found');
    return this.mapIteration(row);
  }

  // ─── Background loop ──────────────────────────────────────────────────────────

  private async runLoop(jobId: string): Promise<void> {
    for (let i = 1; ; i++) {
      if (this.cancelledJobs.has(jobId)) break;

      const job = await this.prisma.closureJob.findUnique({ where: { id: jobId } });
      if (!job || job.status !== 'running') break;

      const strategy = this.extractStrategy(job);

      try {
        const { done, testsGenerated, stalled } = await this.runIteration(job, i, strategy);

        await this.prisma.closureJob.update({
          where: { id: jobId },
          data:  {
            currentIteration:    i,
            testsGeneratedTotal: { increment: testsGenerated },
          },
        });

        if (done || stalled) {
          await this.prisma.closureJob.update({
            where: { id: jobId },
            data:  {
              status:      'completed',
              completedAt: new Date(),
              failureReason: stalled ? 'No actionable gaps remaining' : null,
            },
          });
          break;
        }

        if (i >= job.maxIterations) {
          await this.prisma.closureJob.update({
            where: { id: jobId },
            data:  {
              status:        'completed',
              completedAt:   new Date(),
              failureReason: `Max iterations (${job.maxIterations}) reached`,
            },
          });
          break;
        }

        // Brief pause to yield event loop between iterations
        await new Promise(r => setTimeout(r, 300));
      } catch (err: any) {
        this.logger.error(`Iteration ${i} of job ${jobId} failed: ${err.message}`);
        await this.prisma.closureJob.update({
          where: { id: jobId },
          data:  { status: 'failed', completedAt: new Date(), failureReason: err.message },
        });
        break;
      }
    }
  }

  // ─── Single iteration ─────────────────────────────────────────────────────────

  private async runIteration(
    job:             any,
    iterationNumber: number,
    strategy:        ClosureStrategy,
  ): Promise<{ done: boolean; stalled: boolean; testsGenerated: number }> {
    const { id: jobId, projectId, rtmVersionId } = job;

    // Create iteration record
    const iteration = await this.prisma.closureIteration.create({
      data: {
        closureJobId:    jobId,
        iterationNumber,
        coverageBefore:  {},
        status:          'running',
        startedAt:       new Date(),
      },
    });

    try {
      // ── 1. Recompute coverage ────────────────────────────────────────────────
      await this.coverage.recompute(projectId, rtmVersionId);
      const summary      = await this.coverage.getSummary(projectId, rtmVersionId);
      const coverageBefore = this.toSnapshot(summary);

      await this.prisma.closureIteration.update({
        where: { id: iteration.id },
        data:  { coverageBefore: coverageBefore as any },
      });

      this.logger.log(
        `[Job ${jobId}] Iter ${iterationNumber}: coverage = ${coverageBefore.requirementsCoveragePercent.toFixed(1)}% / target = ${strategy.targetRequirementCoverage * 100}%`,
      );

      // ── 2. Check if already done ──────────────────────────────────────────────
      if (coverageTargetsMet(coverageBefore, strategy)) {
        await this.finalizeIteration(iteration.id, coverageBefore, 0);
        return { done: true, stalled: false, testsGenerated: 0 };
      }

      // ── 3. Recompute gaps ─────────────────────────────────────────────────────
      await this.gaps.recomputeGaps(projectId, rtmVersionId);

      // ── 4. Build generation plan ──────────────────────────────────────────────
      const plan = await this.gaps.getGenerationPlan(projectId, rtmVersionId);

      await this.prisma.closureIteration.update({
        where: { id: iteration.id },
        data:  { generationPlan: plan as any },
      });

      if (!plan || plan.tasks.length === 0) {
        await this.finalizeIteration(iteration.id, coverageBefore, 0);
        return { done: false, stalled: true, testsGenerated: 0 };
      }

      // ── 5. Generate tests ─────────────────────────────────────────────────────
      let testsGenerated = 0;

      if (!strategy.dryRun) {
        const hasMustUI     = plan.tasks.some(t => t.type === 'ui');
        const hasMustAPI    = plan.tasks.some(t => t.type === 'api');
        const hasMustHybrid = plan.tasks.some(t => t.type === 'hybrid');
        const genStrategy   = resolveGenStrategy(plan);

        const genResult = await this.generation.generate(projectId, rtmVersionId, {
          framework:     strategy.framework,
          language:      strategy.language,
          strategy:      genStrategy,
          includeUI:     hasMustUI,
          includeAPI:    hasMustAPI,
          includeHybrid: hasMustHybrid,
          baseUrl:       strategy.baseUrl,
        });

        testsGenerated = Math.min(genResult.totalTests, strategy.maxTestsPerIteration);
      }

      await this.prisma.closureIteration.update({
        where: { id: iteration.id },
        data:  { testsGenerated },
      });

      // ── 6. Recompute coverage after generation ────────────────────────────────
      await this.coverage.recompute(projectId, rtmVersionId);
      const summaryAfter = await this.coverage.getSummary(projectId, rtmVersionId);
      const coverageAfter = this.toSnapshot(summaryAfter);

      // ── 7. Check targets ──────────────────────────────────────────────────────
      const done = !strategy.dryRun && coverageTargetsMet(coverageAfter, strategy);

      await this.finalizeIteration(iteration.id, coverageAfter, testsGenerated);

      return { done, stalled: false, testsGenerated };
    } catch (err: any) {
      await this.prisma.closureIteration.update({
        where: { id: iteration.id },
        data:  { status: 'failed', completedAt: new Date(), failureReason: err.message },
      });
      throw err;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private async finalizeIteration(
    iterationId:   string,
    coverageAfter: CoverageSummarySnapshot,
    testsGenerated: number,
  ): Promise<void> {
    await this.prisma.closureIteration.update({
      where: { id: iterationId },
      data:  { coverageAfter: coverageAfter as any, testsGenerated, status: 'completed', completedAt: new Date() },
    });
  }

  private extractStrategy(job: any): ClosureStrategy {
    return {
      targetRequirementCoverage: job.targetRequirementCoverage,
      targetEndpointCoverage:    job.targetEndpointCoverage   ?? undefined,
      targetJourneyCoverage:     job.targetJourneyCoverage    ?? undefined,
      maxIterations:             job.maxIterations,
      maxTestsPerIteration:      job.maxTestsPerIteration,
      prioritizeHighRisk:        job.prioritizeHighRisk,
      dryRun:                    job.dryRun,
      framework:                 job.framework,
      language:                  job.language,
      baseUrl:                   job.baseUrl,
    };
  }

  private toSnapshot(summary: RTMCoverageSummary | null): CoverageSummarySnapshot {
    if (!summary) {
      return { requirementsTotal: 0, requirementsCovered: 0, requirementsCoveragePercent: 0, endpointsTotal: 0, endpointsCovered: 0, endpointsCoveragePercent: 0, journeysTotal: 0, journeysCovered: 0, journeysCoveragePercent: 0, riskWeightedCoverageScore: 0 };
    }
    return {
      requirementsTotal:           summary.requirementsTotal,
      requirementsCovered:         summary.requirementsCovered,
      requirementsCoveragePercent: summary.requirementsCoveragePercent,
      endpointsTotal:              summary.endpointsTotal,
      endpointsCovered:            summary.endpointsCovered,
      endpointsCoveragePercent:    summary.endpointsCoveragePercent,
      journeysTotal:               summary.journeysTotal,
      journeysCovered:             summary.journeysCovered,
      journeysCoveragePercent:     summary.journeysCoveragePercent,
      riskWeightedCoverageScore:   summary.riskWeightedCoverageScore,
    };
  }

  private mapJob(row: any): ClosureJob {
    return {
      id:                        row.id,
      projectId:                 row.projectId,
      rtmVersionId:              row.rtmVersionId,
      framework:                 row.framework,
      language:                  row.language,
      baseUrl:                   row.baseUrl,
      targetRequirementCoverage: row.targetRequirementCoverage,
      targetEndpointCoverage:    row.targetEndpointCoverage ?? null,
      targetJourneyCoverage:     row.targetJourneyCoverage  ?? null,
      maxIterations:             row.maxIterations,
      maxTestsPerIteration:      row.maxTestsPerIteration,
      prioritizeHighRisk:        row.prioritizeHighRisk,
      dryRun:                    row.dryRun,
      status:                    row.status,
      currentIteration:          row.currentIteration,
      testsGeneratedTotal:       row.testsGeneratedTotal,
      createdAt:                 row.createdAt.toISOString(),
      completedAt:               row.completedAt?.toISOString() ?? null,
      failureReason:             row.failureReason ?? null,
      iterations:                row.iterations?.map((it: any) => this.mapIteration(it)),
    };
  }

  private mapIteration(row: any): ClosureIteration {
    return {
      id:              row.id,
      closureJobId:    row.closureJobId,
      iterationNumber: row.iterationNumber,
      coverageBefore:  row.coverageBefore as CoverageSummarySnapshot,
      coverageAfter:   row.coverageAfter  as CoverageSummarySnapshot ?? null,
      generationPlan:  row.generationPlan as Record<string, any> ?? null,
      testsGenerated:  row.testsGenerated,
      testsExecuted:   row.testsExecuted,
      status:          row.status,
      startedAt:       row.startedAt?.toISOString()   ?? null,
      completedAt:     row.completedAt?.toISOString() ?? null,
      failureReason:   row.failureReason ?? null,
    };
  }
}
