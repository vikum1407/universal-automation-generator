import { RTMDocument } from './rtm.model';
import { RTMExecutionDocument } from './rtm.execution.model';
import { RTMAnalytics } from './rtm.analytics';

export interface RTMInsights {
  executiveSummary: string;
  coverageNarrative: string;
  executionNarrative: string;
  riskNarrative: string;
  recommendations: string[];
  priorityList: string[];
}

export class RTMInsightsEngine {
  generate(
    analytics: RTMAnalytics,
    rtm: RTMDocument,
    exec?: RTMExecutionDocument
  ): RTMInsights {
    return {
      executiveSummary: this.buildExecutiveSummary(analytics),
      coverageNarrative: this.buildCoverageNarrative(analytics),
      executionNarrative: this.buildExecutionNarrative(analytics),
      riskNarrative: this.buildRiskNarrative(analytics),
      recommendations: this.buildRecommendations(analytics),
      priorityList: this.buildPriorityList(analytics)
    };
  }

  private buildExecutiveSummary(a: RTMAnalytics): string {
    return [
      `Total requirements: ${a.coverage.totalRequirements}.`,
      `Coverage is ${a.coverage.coveragePercent.toFixed(1)}%.`,
      `Execution completion is ${a.execution.executionPercent.toFixed(1)}%.`,
      a.highRiskAreas.length
        ? `Identified ${a.highRiskAreas.length} high‑risk areas requiring attention.`
        : `No major risk areas detected.`
    ].join(' ');
  }

  private buildCoverageNarrative(a: RTMAnalytics): string {
    return [
      `UI coverage is ${a.coverage.uiCoveragePercent.toFixed(1)}% (${a.coverage.uiCovered}/${a.coverage.uiTotal}).`,
      `API coverage is ${a.coverage.apiCoveragePercent.toFixed(1)}% (${a.coverage.apiCovered}/${a.coverage.apiTotal}).`,
      a.coverage.uncovered > 0
        ? `${a.coverage.uncovered} requirements are not covered by any test cases.`
        : `All requirements are covered by at least one test case.`,
      a.coverage.aiEnrichedCount > 0
        ? `${a.coverage.aiEnrichedCount} requirements include AI‑generated logic.`
        : `No AI‑generated logic detected yet.`
    ].join(' ');
  }

  private buildExecutionNarrative(a: RTMAnalytics): string {
    if (!a.execution.hasExecution) {
      return `No execution results were provided.`;
    }

    return [
      `${a.execution.passed} tests passed and ${a.execution.failed} failed.`,
      `${a.execution.notExecuted} requirements have no execution results.`,
      a.execution.flakyCandidates.length
        ? `Detected ${a.execution.flakyCandidates.length} flaky test candidates.`
        : `No flaky tests detected.`
    ].join(' ');
  }

  private buildRiskNarrative(a: RTMAnalytics): string {
    if (!a.highRiskAreas.length) {
      return `No high‑risk areas detected.`;
    }

    const lines = a.highRiskAreas.map(area => {
      const issues = [];
      if (area.uncoveredCount > 0) {
        issues.push(`${area.uncoveredCount} uncovered`);
      }
      if (area.failingCount > 0) {
        issues.push(`${area.failingCount} failing`);
      }
      return `${area.label} (${issues.join(', ')})`;
    });

    return `High‑risk areas include: ${lines.join('; ')}.`;
  }

  private buildRecommendations(a: RTMAnalytics): string[] {
    const recs: string[] = [];

    if (a.coverage.uncovered > 0) {
      recs.push(`Add test cases for the ${a.coverage.uncovered} uncovered requirements.`);
    }

    if (a.execution.failed > 0) {
      recs.push(`Investigate and fix the ${a.execution.failed} failing tests.`);
    }

    if (a.execution.flakyCandidates.length > 0) {
      recs.push(`Stabilize the ${a.execution.flakyCandidates.length} flaky test candidates.`);
    }

    if (a.highRiskAreas.length > 0) {
      recs.push(`Prioritize high‑risk areas such as ${a.highRiskAreas[0].label}.`);
    }

    if (recs.length === 0) {
      recs.push(`System is stable. Maintain current coverage and execution quality.`);
    }

    return recs;
  }

  private buildPriorityList(a: RTMAnalytics): string[] {
    const list: string[] = [];

    for (const area of a.highRiskAreas) {
      if (area.uncoveredCount > 0) {
        list.push(`Add missing tests for ${area.label}.`);
      }
      if (area.failingCount > 0) {
        list.push(`Fix failing tests in ${area.label}.`);
      }
    }

    if (a.execution.flakyCandidates.length > 0) {
      list.push(`Stabilize flaky tests: ${a.execution.flakyCandidates.join(', ')}.`);
    }

    return list.slice(0, 5);
  }
}
