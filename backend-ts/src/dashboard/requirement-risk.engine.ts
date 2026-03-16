import { Injectable } from '@nestjs/common';

export type RequirementType = 'ui' | 'api' | string;

export interface Requirement {
  id: string;
  type: RequirementType;
  page?: string;
  url?: string;
  coveredBy?: string[];
  aiLogic?: {
    steps: string[];
    assertions: string[];
  };
}

export interface ExecutionResult {
  requirementId: string;
  status: 'passed' | 'failed' | 'not_executed';
}

export interface RunFile {
  id: string;
  project: string;
  timestamp: string;
  rtm: {
    requirements: Requirement[];
  };
  execution?: {
    results: ExecutionResult[];
  };
  analytics?: any;
  insights?: any;
  releaseReadinessScore?: number;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RequirementRiskSummary {
  requirement: Requirement;
  latestStatus: 'passed' | 'failed' | 'not_executed';
  hasCoverage: boolean;
  isAiEnriched: boolean;
  riskLevel: RiskLevel;
  riskScore: number; // 0–100
  lastRunId?: string;
  lastRunTimestamp?: string;
  failureCount: number;
  totalExecutions: number;
  uncoveredRuns: number;
}

export interface GroupedRequirementRisk {
  highRisk: RequirementRiskSummary[];
  failing: RequirementRiskSummary[];
  uncovered: RequirementRiskSummary[];
  api: RequirementRiskSummary[];
  ui: RequirementRiskSummary[];
  aiEnriched: RequirementRiskSummary[];
  all: RequirementRiskSummary[];
}

@Injectable()
export class RequirementRiskEngine {
  computeGroupedRisk(runs: RunFile[]): GroupedRequirementRisk {
    if (!runs || runs.length === 0) {
      return {
        highRisk: [],
        failing: [],
        uncovered: [],
        api: [],
        ui: [],
        aiEnriched: [],
        all: [],
      };
    }

    // Use latest run per project as "current" status, but count history across all runs
    const latestRun = runs[runs.length - 1];

    const requirementMap = new Map<string, Requirement>();
    latestRun.rtm.requirements.forEach((req) => {
      requirementMap.set(req.id, req);
    });

    const historyByRequirement = new Map<
      string,
      {
        failureCount: number;
        totalExecutions: number;
        uncoveredRuns: number;
        latestStatus: 'passed' | 'failed' | 'not_executed';
        lastRunId?: string;
        lastRunTimestamp?: string;
      }
    >();

    // Initialize from latest run requirements
    for (const req of latestRun.rtm.requirements) {
      historyByRequirement.set(req.id, {
        failureCount: 0,
        totalExecutions: 0,
        uncoveredRuns: 0,
        latestStatus: 'not_executed',
        lastRunId: latestRun.id,
        lastRunTimestamp: latestRun.timestamp,
      });
    }

    // Walk all runs to build history
    for (const run of runs) {
      const execResults = run.execution?.results ?? [];
      const executedIds = new Set(execResults.map((r) => r.requirementId));

      // Mark executions
      for (const result of execResults) {
        if (!historyByRequirement.has(result.requirementId)) {
          // Requirement might have existed in older runs only
          const fallbackReq: Requirement = {
            id: result.requirementId,
            type: 'unknown',
          };
          requirementMap.set(result.requirementId, fallbackReq);
          historyByRequirement.set(result.requirementId, {
            failureCount: 0,
            totalExecutions: 0,
            uncoveredRuns: 0,
            latestStatus: 'not_executed',
          });
        }

        const hist = historyByRequirement.get(result.requirementId)!;
        hist.totalExecutions += 1;
        if (result.status === 'failed') {
          hist.failureCount += 1;
        }

        // Latest status is from the latest run in the array
        if (run.id === latestRun.id) {
          hist.latestStatus = result.status;
          hist.lastRunId = run.id;
          hist.lastRunTimestamp = run.timestamp;
        }
      }

      // Mark uncovered (no execution result for requirement in this run)
      for (const req of run.rtm.requirements) {
        if (!historyByRequirement.has(req.id)) {
          historyByRequirement.set(req.id, {
            failureCount: 0,
            totalExecutions: 0,
            uncoveredRuns: 0,
            latestStatus: 'not_executed',
          });
        }
        if (!executedIds.has(req.id)) {
          const hist = historyByRequirement.get(req.id)!;
          hist.uncoveredRuns += 1;
        }
      }
    }

    const all: RequirementRiskSummary[] = [];

    for (const [id, hist] of historyByRequirement.entries()) {
      const requirement = requirementMap.get(id)!;
      const hasCoverage = Array.isArray(requirement.coveredBy) && requirement.coveredBy.length > 0;
      const isAiEnriched =
        !!requirement.aiLogic &&
        ((requirement.aiLogic.steps?.length ?? 0) > 0 ||
          (requirement.aiLogic.assertions?.length ?? 0) > 0);

      const riskScore = this.computeRiskScore({
        hasCoverage,
        latestStatus: hist.latestStatus,
        failureCount: hist.failureCount,
        totalExecutions: hist.totalExecutions,
        uncoveredRuns: hist.uncoveredRuns,
      });

      const riskLevel: RiskLevel =
        riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

      all.push({
        requirement,
        latestStatus: hist.latestStatus,
        hasCoverage,
        isAiEnriched,
        riskLevel,
        riskScore,
        lastRunId: hist.lastRunId,
        lastRunTimestamp: hist.lastRunTimestamp,
        failureCount: hist.failureCount,
        totalExecutions: hist.totalExecutions,
        uncoveredRuns: hist.uncoveredRuns,
      });
    }

    const highRisk = all.filter((r) => r.riskLevel === 'high').sort((a, b) => b.riskScore - a.riskScore);
    const failing = all
      .filter((r) => r.latestStatus === 'failed')
      .sort((a, b) => b.riskScore - a.riskScore);
    const uncovered = all
      .filter((r) => !r.hasCoverage)
      .sort((a, b) => b.uncoveredRuns - a.uncoveredRuns);
    const api = all.filter((r) => r.requirement.type === 'api');
    const ui = all.filter((r) => r.requirement.type === 'ui');
    const aiEnriched = all.filter((r) => r.isAiEnriched);

    return {
      highRisk,
      failing,
      uncovered,
      api,
      ui,
      aiEnriched,
      all,
    };
  }

  private computeRiskScore(input: {
    hasCoverage: boolean;
    latestStatus: 'passed' | 'failed' | 'not_executed';
    failureCount: number;
    totalExecutions: number;
    uncoveredRuns: number;
  }): number {
    let score = 0;

    // Coverage
    if (!input.hasCoverage) {
      score += 30;
    }

    // Latest status
    if (input.latestStatus === 'failed') {
      score += 40;
    } else if (input.latestStatus === 'not_executed') {
      score += 20;
    }

    // Historical failures
    if (input.totalExecutions > 0) {
      const failureRate = input.failureCount / input.totalExecutions;
      score += Math.min(20, failureRate * 40);
    }

    // Uncovered history
    if (input.uncoveredRuns > 0) {
      score += Math.min(10, input.uncoveredRuns * 2);
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
