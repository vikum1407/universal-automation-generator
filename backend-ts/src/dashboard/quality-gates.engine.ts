import { Injectable } from '@nestjs/common';
import { HistoryRun } from '../history/history.model';

export interface QualityGateResult {
  status: 'pass' | 'warn' | 'fail';
  reasons: string[];
}

@Injectable()
export class QualityGatesEngine {
  evaluate(run: HistoryRun): QualityGateResult {
    const reasons: string[] = [];

    const coverage = run.analytics.coverage.coveragePercent;
    const execution = run.analytics.execution.executionPercent;
    const risks = run.analytics.highRiskAreas.length;

    if (coverage < 70) {
      reasons.push(`Coverage too low (${coverage.toFixed(1)}%)`);
    }

    if (execution < 70) {
      reasons.push(`Execution completeness too low (${execution.toFixed(1)}%)`);
    }

    if (risks > 5) {
      reasons.push(`Too many high-risk areas (${risks})`);
    }

    if (reasons.length === 0) {
      return { status: 'pass', reasons };
    }

    if (coverage >= 60 && execution >= 60 && risks <= 10) {
      return { status: 'warn', reasons };
    }

    return { status: 'fail', reasons };
  }
}
