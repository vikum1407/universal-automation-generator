import { Injectable } from '@nestjs/common';
import { HistoryRun } from '../history/history.model';
import { RTMInsightsEngine } from '../rtm/rtm.insights';

@Injectable()
export class ReleaseIntelligenceEngine {
  compute(run: HistoryRun, previous?: HistoryRun) {
    const insightsEngine = new RTMInsightsEngine();

    const insights = insightsEngine.generate(
      run.analytics,
      run.rtm,
      run.execution
    );

    const riskScore = this.computeRiskScore(run);
    const changeImpact = this.computeChangeImpact(run, previous);
    const qualityGate = this.computeQualityGate(riskScore);

    return {
      project: run.project,
      timestamp: run.timestamp,
      releaseReadinessScore: run.releaseReadinessScore,
      riskScore,
      qualityGate,
      changeImpact,
      insights,
      summary: this.generateSummary(run, riskScore, qualityGate)
    };
  }

  private computeRiskScore(run: HistoryRun): number {
    const coverage = run.analytics.coverage.coveragePercent;
    const execution = run.analytics.execution.executionPercent;
    const risks = run.analytics.highRiskAreas.length;

    const score =
      (100 - coverage) * 0.3 +
      (100 - execution) * 0.3 +
      risks * 10 * 0.4;

    return Math.min(100, Math.max(0, score));
  }

  private computeQualityGate(riskScore: number): 'pass' | 'warn' | 'fail' {
    if (riskScore < 30) return 'pass';
    if (riskScore < 60) return 'warn';
    return 'fail';
  }

  private computeChangeImpact(current: HistoryRun, previous?: HistoryRun) {
    if (!previous) {
      return {
        type: 'initial',
        message: 'No previous run available — baseline established.'
      };
    }

    const deltaCoverage =
      current.analytics.coverage.coveragePercent -
      previous.analytics.coverage.coveragePercent;

    const deltaExecution =
      current.analytics.execution.executionPercent -
      previous.analytics.execution.executionPercent;

    return {
      type: 'delta',
      deltaCoverage,
      deltaExecution
    };
  }

  private generateSummary(
    run: HistoryRun,
    riskScore: number,
    qualityGate: string
  ) {
    return `Release summary for ${run.project}: Coverage ${run.analytics.coverage.coveragePercent.toFixed(
      1
    )}%, Execution ${run.analytics.execution.executionPercent.toFixed(
      1
    )}%, Risk Score ${riskScore.toFixed(1)} (${qualityGate}).`;
  }
}
