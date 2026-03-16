import { Injectable } from '@nestjs/common';

@Injectable()
export class ReleaseReadinessEngine {
  compute(
    runs: any[],
    currentInsights: any,
    previousInsights: any | null
  ) {
    if (!runs.length) {
      return this.empty();
    }

    const latest = runs[0];
    const previous = runs[1];

    const analytics = latest.analytics ?? {};
    const executionPercent = analytics.execution?.executionPercent ?? 0;
    const coveragePercent = analytics.coverage?.coveragePercent ?? 0;

    const stabilityScore = currentInsights.summary?.stabilityScore ?? 0;
    const riskScore = currentInsights.summary?.riskScore ?? 0;
    const coverageScore = currentInsights.summary?.coverageScore ?? coveragePercent;

    const readinessScore =
      stabilityScore * 0.4 +
      executionPercent * 0.2 +
      coveragePercent * 0.2 +
      (100 - riskScore) * 0.2;

    const tests = latest.execution?.tests ?? [];
    const passCount = tests.filter((t: any) => t.status === 'passed').length;
    const failCount = tests.filter((t: any) => t.status === 'failed').length;
    const durationMs = tests.reduce(
      (sum: number, t: any) => sum + (t.durationMs ?? 0),
      0
    );

    const previousTests = previous?.execution?.tests ?? [];
    const previousFailedIds = new Set(
      previousTests.filter((t: any) => t.status === 'failed').map((t: any) => t.id)
    );
    const previousPassedIds = new Set(
      previousTests.filter((t: any) => t.status === 'passed').map((t: any) => t.id)
    );

    const newFailures = tests
      .filter((t: any) => t.status === 'failed' && !previousFailedIds.has(t.id))
      .map((t: any) => t.id);

    const fixedTests = tests
      .filter((t: any) => t.status === 'passed' && previousFailedIds.has(t.id))
      .map((t: any) => t.id);

    const highRiskJourneys = currentInsights.recurringFailures.map(
      (f: any) => f.testId
    );

    const trends = this.computeTrends(runs, currentInsights);
    const compare = this.computeCompare(
      latest,
      previous,
      currentInsights,
      previousInsights
    );

    const aiRecommendation = this.computeAiRecommendation(
      readinessScore,
      riskScore,
      stabilityScore
    );

    return {
      releaseSummary: {
        readinessScore: Math.round(readinessScore),
        riskScore,
        stabilityScore,
        coverageScore,
        aiSummary: this.buildAiSummary(readinessScore, riskScore, stabilityScore)
      },
      latestRun: {
        id: latest.id,
        timestamp: latest.timestamp,
        passCount,
        failCount,
        durationMs,
        newFailures,
        fixedTests,
        highRiskJourneys
      },
      trends,
      insights: {
        recurringFailures: currentInsights.recurringFailures.map((f: any) => f.testId),
        clusters: currentInsights.clusters.map((c: any) => c.label),
        flakyTests: currentInsights.flakyTests.map((f: any) => f.testId),
        slowJourneys: currentInsights.slowestJourneys.map((j: any) => j.journeyId)
      },
      compare,
      aiRecommendation
    };
  }

  private computeTrends(runs: any[], insights: any) {
    if (runs.length < 2) {
      return {
        passRateTrend: 'stable',
        failureTrend: 'stable',
        durationTrend: 'stable',
        stabilityTrend: 'stable'
      };
    }

    const latest = runs[0];
    const previous = runs[1];

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

    const stabilityScore = insights.summary?.stabilityScore ?? 0;
    const stabilityTrend =
      stabilityScore >= 80 ? 'improving' : stabilityScore <= 50 ? 'worsening' : 'stable';

    return {
      passRateTrend:
        latestPassRate > previousPassRate ? 'improving' :
        latestPassRate < previousPassRate ? 'worsening' :
        'stable',
      failureTrend:
        latestFailures < previousFailures ? 'improving' :
        latestFailures > previousFailures ? 'worsening' :
        'stable',
      durationTrend:
        latestDuration < previousDuration ? 'improving' :
        latestDuration > previousDuration ? 'worsening' :
        'stable',
      stabilityTrend
    };
  }

  private computeCompare(
    latest: any,
    previous: any | undefined,
    currentInsights: any,
    previousInsights: any | null
  ) {
    if (!previous) {
      return {
        previousRunId: '',
        regressions: [],
        improvements: [],
        riskDelta: 0,
        stabilityDelta: 0
      };
    }

    const latestTests = latest.execution?.tests ?? [];
    const previousTests = previous.execution?.tests ?? [];

    const latestFailedIds = new Set(
      latestTests.filter((t: any) => t.status === 'failed').map((t: any) => t.id)
    );
    const previousFailedIds = new Set(
      previousTests.filter((t: any) => t.status === 'failed').map((t: any) => t.id)
    );

    const regressions = [...latestFailedIds]
      .filter(id => !previousFailedIds.has(id))
      .map(id => id as string);

    const improvements = [...previousFailedIds]
      .filter(id => !latestFailedIds.has(id))
      .map(id => id as string);

    const currentRisk = currentInsights.summary?.riskScore ?? 0;
    const previousRisk = previousInsights?.summary?.riskScore ?? currentRisk;
    const currentStability = currentInsights.summary?.stabilityScore ?? 0;
    const previousStability = previousInsights?.summary?.stabilityScore ?? currentStability;

    return {
      previousRunId: previous.id,
      regressions,
      improvements,
      riskDelta: currentRisk - previousRisk,
      stabilityDelta: currentStability - previousStability
    };
  }

  private computeAiRecommendation(
    readinessScore: number,
    riskScore: number,
    stabilityScore: number
  ) {
    let status: 'safe' | 'risky' | 'blocked' = 'safe';
    let severity: 'low' | 'medium' | 'high' = 'low';
    let detail = 'Release looks safe based on current signals.';

    if (readinessScore < 60 || riskScore > 60) {
      status = 'blocked';
      severity = 'high';
      detail =
        'Release is blocked due to high risk and low readiness. Address critical failures and risks before proceeding.';
    } else if (readinessScore < 80 || riskScore > 40 || stabilityScore < 70) {
      status = 'risky';
      severity = 'medium';
      detail =
        'Release is risky. Fix recurring failures, flaky tests, and high‑risk journeys before proceeding.';
    }

    return {
      status,
      detail,
      severity
    };
  }

  private buildAiSummary(
    readinessScore: number,
    riskScore: number,
    stabilityScore: number
  ) {
    return `Readiness ${Math.round(
      readinessScore
    )}/100, risk score ${riskScore}, stability ${stabilityScore}. Focus on reducing risk and improving stability before critical releases.`;
  }

  private empty() {
    return {
      releaseSummary: {
        readinessScore: 0,
        riskScore: 0,
        stabilityScore: 0,
        coverageScore: 0,
        aiSummary: 'No data available yet.'
      },
      latestRun: {
        id: '',
        timestamp: '',
        passCount: 0,
        failCount: 0,
        durationMs: 0,
        newFailures: [],
        fixedTests: [],
        highRiskJourneys: []
      },
      trends: {
        passRateTrend: 'stable',
        failureTrend: 'stable',
        durationTrend: 'stable',
        stabilityTrend: 'stable'
      },
      insights: {
        recurringFailures: [],
        clusters: [],
        flakyTests: [],
        slowJourneys: []
      },
      compare: {
        previousRunId: '',
        regressions: [],
        improvements: [],
        riskDelta: 0,
        stabilityDelta: 0
      },
      aiRecommendation: {
        status: 'blocked',
        detail: 'No historical data available to assess release readiness.',
        severity: 'high'
      }
    };
  }
}
