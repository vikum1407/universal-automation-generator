import { Injectable } from '@nestjs/common';

@Injectable()
export class ReleaseEvolutionEngine {
  compute(runs: any[]) {
    if (!runs.length) {
      return {
        trends: {
          passRate: 'stable',
          failureRate: 'stable',
          duration: 'stable',
          stability: 'stable'
        },
        riskForecast: {
          nextRunRiskScore: 0,
          confidence: 'low'
        },
        recommendations: []
      };
    }

    const lastRuns = runs.slice(0, 5);
    const passRates: number[] = [];
    const failureCounts: number[] = [];
    const durations: number[] = [];

    for (const run of lastRuns) {
      const tests = run.execution?.tests ?? [];
      const passCount = tests.filter((t: any) => t.status === 'passed').length;
      const failCount = tests.filter((t: any) => t.status === 'failed').length;
      const total = tests.length || 1;
      const passRate = (passCount / total) * 100;
      const duration = tests.reduce(
        (sum: number, t: any) => sum + (t.durationMs ?? 0),
        0
      );

      passRates.push(passRate);
      failureCounts.push(failCount);
      durations.push(duration);
    }

    const trend = (values: number[]): 'improving' | 'worsening' | 'stable' => {
      if (values.length < 2) return 'stable';
      const first = values[values.length - 1];
      const last = values[0];
      if (last > first + 5) return 'improving';
      if (last < first - 5) return 'worsening';
      return 'stable';
    };

    const passRateTrend = trend(passRates);
    const failureTrend = trend(failureCounts.map(v => -v));
    const durationTrend = trend(durations.map(v => -v));

    const latest = runs[0];
    const latestRisk =
      latest.analytics?.highRiskAreas?.length ?? 0;

    const nextRunRiskScore = Math.max(
      0,
      Math.min(100, latestRisk * 10)
    );

    const recommendations: string[] = [];

    if (failureTrend === 'worsening') {
      recommendations.push(
        'Failure rate is trending upward. Investigate recurring failures and flaky tests.'
      );
    }
    if (durationTrend === 'worsening') {
      recommendations.push(
        'Execution duration is increasing. Optimize slow journeys and long‑running tests.'
      );
    }
    if (passRateTrend === 'worsening') {
      recommendations.push(
        'Pass rate is decreasing. Focus on stabilizing critical journeys.'
      );
    }

    return {
      trends: {
        passRate: passRateTrend,
        failureRate: failureTrend,
        duration: durationTrend,
        stability: 'stable'
      },
      riskForecast: {
        nextRunRiskScore,
        confidence: 'medium'
      },
      recommendations
    };
  }
}
