import { Injectable } from '@nestjs/common';
import { RunFile } from './requirement-risk.engine';

export interface RequirementHistoryPoint {
  runId: string;
  timestamp: string;
  status: 'passed' | 'failed' | 'not_executed';
  hasCoverage: boolean;
  riskScore: number;
}

export interface RequirementHistory {
  requirementId: string;
  points: RequirementHistoryPoint[];
}

@Injectable()
export class RequirementHistoryEngine {
  constructor() {}

  buildHistory(requirementId: string, runs: RunFile[]): RequirementHistory {
    const points: RequirementHistoryPoint[] = [];

    for (const run of runs) {
      const requirement = run.rtm.requirements.find((r) => r.id === requirementId);
      if (!requirement) {
        continue;
      }

      const execResult = run.execution?.results?.find(
        (r) => r.requirementId === requirementId,
      );

      const status: 'passed' | 'failed' | 'not_executed' =
        execResult?.status ?? 'not_executed';

      const hasCoverage =
        Array.isArray(requirement.coveredBy) && requirement.coveredBy.length > 0;

      // Simple per-run risk score (lighter than full engine)
      let riskScore = 0;
      if (!hasCoverage) riskScore += 30;
      if (status === 'failed') riskScore += 40;
      if (status === 'not_executed') riskScore += 20;

      points.push({
        runId: run.id,
        timestamp: run.timestamp,
        status,
        hasCoverage,
        riskScore: Math.max(0, Math.min(100, riskScore)),
      });
    }

    // Ensure chronological order
    points.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return {
      requirementId,
      points,
    };
  }
}
