import { Injectable } from '@nestjs/common';
import { RunFile } from './requirement-risk.engine';

export interface RequirementPattern {
  requirementId: string;
  recurringFailures: boolean;
  failureCount: number;
  totalExecutions: number;
  longUncovered: boolean;
  uncoveredRuns: number;
  isApiHotspot: boolean;
  isUiHotspot: boolean;
}

@Injectable()
export class RequirementPatternsEngine {
  detectPatterns(requirementId: string, runs: RunFile[]): RequirementPattern {
    let failureCount = 0;
    let totalExecutions = 0;
    let uncoveredRuns = 0;
    let type: string | undefined;

    for (const run of runs) {
      const requirement = run.rtm.requirements.find((r) => r.id === requirementId);
      if (requirement && !type) {
        type = requirement.type;
      }

      const execResult = run.execution?.results?.find(
        (r) => r.requirementId === requirementId,
      );

      if (execResult) {
        totalExecutions += 1;
        if (execResult.status === 'failed') {
          failureCount += 1;
        }
      } else if (requirement) {
        uncoveredRuns += 1;
      }
    }

    const recurringFailures = failureCount >= 2;
    const longUncovered = uncoveredRuns >= 3;

    const isApiHotspot = type === 'api' && (recurringFailures || longUncovered);
    const isUiHotspot = type === 'ui' && (recurringFailures || longUncovered);

    return {
      requirementId,
      recurringFailures,
      failureCount,
      totalExecutions,
      longUncovered,
      uncoveredRuns,
      isApiHotspot,
      isUiHotspot,
    };
  }
}
