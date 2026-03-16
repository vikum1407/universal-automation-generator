import { Injectable } from '@nestjs/common';
import { HistoryRun } from '../history/history.model';

@Injectable()
export class ReleaseTimelineEngine {
  buildTimeline(runs: HistoryRun[]) {
    return runs.map(run => ({
      timestamp: run.timestamp,
      coverage: run.analytics.coverage.coveragePercent,
      execution: run.analytics.execution.executionPercent,
      risks: run.analytics.highRiskAreas.length,
      rrs: run.releaseReadinessScore
    }));
  }

  compareRuns(a: HistoryRun, b: HistoryRun) {
    return {
      from: a.timestamp,
      to: b.timestamp,
      deltaCoverage:
        b.analytics.coverage.coveragePercent -
        a.analytics.coverage.coveragePercent,
      deltaExecution:
        b.analytics.execution.executionPercent -
        a.analytics.execution.executionPercent,
      deltaRisks:
        b.analytics.highRiskAreas.length -
        a.analytics.highRiskAreas.length,
      deltaRRS: b.releaseReadinessScore - a.releaseReadinessScore
    };
  }
}
