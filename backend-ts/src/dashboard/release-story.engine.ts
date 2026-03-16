import { Injectable } from '@nestjs/common';

@Injectable()
export class ReleaseStoryEngine {
  compute(
    latest: any,
    previous: any | undefined,
    currentInsights: any,
    previousInsights: any | null,
    readiness: any
  ) {
    const summary = this.buildSummary(latest, previous, readiness);
    const highlights = this.buildHighlights(
      latest,
      previous,
      currentInsights,
      previousInsights
    );
    const metrics = this.buildMetrics(latest, previous, currentInsights, previousInsights);
    const verdict = this.buildVerdict(readiness);

    return {
      summary,
      highlights,
      metrics,
      verdict
    };
  }

  private buildSummary(latest: any, previous: any | undefined, readiness: any) {
    const title = `Release Story – ${latest.project}`;

    const paragraphs: string[] = [];

    const rs = readiness.releaseSummary.readinessScore;
    const risk = readiness.releaseSummary.riskScore;
    const stability = readiness.releaseSummary.stabilityScore;
    const coverage = readiness.releaseSummary.coverageScore;

    paragraphs.push(
      `This release achieved a readiness score of ${rs}/100 with risk score ${risk} and stability ${stability}.`
    );
    paragraphs.push(
      `Test coverage is at ${coverage}%, reflecting the current depth of validation across journeys.`
    );

    if (!previous) {
      paragraphs.push(
        'This is the first recorded release for this project, establishing the baseline for future comparisons.'
      );
    } else {
      paragraphs.push(
        'Compared to the previous release, this run shows changes in coverage, execution stability, and risk profile.'
      );
    }

    return { title, narrative: paragraphs };
  }

  private buildHighlights(
    latest: any,
    previous: any | undefined,
    currentInsights: any,
    previousInsights: any | null
  ) {
    const improvements: string[] = [];
    const regressions: string[] = [];
    const riskDrops: string[] = [];
    const riskSpikes: string[] = [];

    const latestTests = latest.execution?.tests ?? [];
    const previousTests = previous?.execution?.tests ?? [];

    const latestFailedIds = new Set(
      latestTests.filter((t: any) => t.status === 'failed').map((t: any) => t.id)
    );
    const previousFailedIds = new Set(
      previousTests.filter((t: any) => t.status === 'failed').map((t: any) => t.id)
    );

    for (const id of previousFailedIds) {
      if (!latestFailedIds.has(id)) {
        improvements.push(`Test ${id} is now passing.`);
      }
    }

    for (const id of latestFailedIds) {
      if (!previousFailedIds.has(id)) {
        regressions.push(`New failure detected in test ${id}.`);
      }
    }

    const currentRisk = currentInsights.summary?.riskScore ?? 0;
    const previousRisk = previousInsights?.summary?.riskScore ?? currentRisk;

    if (currentRisk < previousRisk) {
      riskDrops.push(
        `Overall risk score dropped from ${previousRisk} to ${currentRisk}.`
      );
    } else if (currentRisk > previousRisk) {
      riskSpikes.push(
        `Overall risk score increased from ${previousRisk} to ${currentRisk}.`
      );
    }

    return {
      improvements,
      regressions,
      riskDrops,
      riskSpikes
    };
  }

  private buildMetrics(
    latest: any,
    previous: any | undefined,
    currentInsights: any,
    previousInsights: any | null
  ) {
    if (!previous) {
      return {
        passRateDelta: '0%',
        failureDelta: '0',
        durationDeltaMs: '0',
        stabilityDelta: '0',
        riskDelta: '0'
      };
    }

    const latestTests = latest.execution?.tests ?? [];
    const previousTests = previous.execution?.tests ?? [];

    const latestPassRate =
      latestTests.length === 0
        ? 0
        : (latestTests.filter((t: any) => t.status === 'passed').length /
            latestTests.length) *
          100;

    const previousPassRate =
      previousTests.length === 0
        ? 0
        : (previousTests.filter((t: any) => t.status === 'passed').length /
            previousTests.length) *
          100;

    const latestFailures = latestTests.filter((t: any) => t.status === 'failed').length;
    const previousFailures = previousTests.filter((t: any) => t.status === 'failed').length;

    const latestDuration = latestTests.reduce(
      (sum: number, t: any) => sum + (t.durationMs ?? 0),
      0
    );
    const previousDuration = previousTests.reduce(
      (sum: number, t: any) => sum + (t.durationMs ?? 0),
      0
    );

    const currentStability = currentInsights.summary?.stabilityScore ?? 0;
    const previousStability = previousInsights?.summary?.stabilityScore ?? currentStability;
    const currentRisk = currentInsights.summary?.riskScore ?? 0;
    const previousRisk = previousInsights?.summary?.riskScore ?? currentRisk;

    return {
      passRateDelta: `${(latestPassRate - previousPassRate).toFixed(1)}%`,
      failureDelta: `${latestFailures - previousFailures}`,
      durationDeltaMs: `${latestDuration - previousDuration}`,
      stabilityDelta: `${(currentStability - previousStability).toFixed(1)}`,
      riskDelta: `${(currentRisk - previousRisk).toFixed(1)}`
    };
  }

  private buildVerdict(readiness: any) {
    const rs = readiness.releaseSummary.readinessScore;
    const risk = readiness.releaseSummary.riskScore;

    let status: 'safe' | 'risky' | 'blocked' = 'safe';
    let severity: 'low' | 'medium' | 'high' = 'low';
    let reason = 'Release is considered safe based on current readiness and risk levels.';

    if (rs < 60 || risk > 60) {
      status = 'blocked';
      severity = 'high';
      reason =
        'Release is blocked due to low readiness and high risk. Address critical failures and risks before proceeding.';
    } else if (rs < 80 || risk > 40) {
      status = 'risky';
      severity = 'medium';
      reason =
        'Release is risky. Fix recurring failures, flaky tests, and high‑risk journeys before proceeding.';
    }

    return {
      status,
      reason,
      severity
    };
  }
}
