import { Injectable } from '@nestjs/common';
import { HistoryRun } from '../history/history.model';

@Injectable()
export class ReleaseNotesEngine {
  generate(latest: HistoryRun, previous?: HistoryRun) {
    const coverage = latest.analytics.coverage.coveragePercent.toFixed(1);
    const execution = latest.analytics.execution.executionPercent.toFixed(1);
    const risks = latest.analytics.highRiskAreas.length;

    const deltaCoverage = previous
      ? (latest.analytics.coverage.coveragePercent -
          previous.analytics.coverage.coveragePercent).toFixed(1)
      : null;

    const deltaExecution = previous
      ? (latest.analytics.execution.executionPercent -
          previous.analytics.execution.executionPercent).toFixed(1)
      : null;

    return {
      title: `Release Notes – ${latest.project}`,
      summary: `This release achieved ${coverage}% coverage and ${execution}% execution completeness with ${risks} identified risk areas.`,

      improvements: [
        deltaCoverage !== null
          ? `Coverage improved by ${deltaCoverage}%`
          : `Initial baseline coverage established at ${coverage}%`,
        deltaExecution !== null
          ? `Execution completeness changed by ${deltaExecution}%`
          : `Initial baseline execution completeness is ${execution}%`
      ],

      highRiskAreas: latest.analytics.highRiskAreas.map(a => ({
        area: a.label,
        uncovered: a.uncoveredCount,
        failing: a.failingCount
      })),

      recommendations: [
        risks > 0
          ? `Address ${risks} high‑risk areas before release.`
          : `No high‑risk areas detected.`,
        latest.analytics.coverage.coveragePercent < 80
          ? `Increase test coverage to reduce release risk.`
          : `Coverage is healthy.`,
        latest.analytics.execution.executionPercent < 80
          ? `Improve execution stability and reduce failures.`
          : `Execution results are stable.`
      ]
    };
  }
}
