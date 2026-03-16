import { Injectable } from '@nestjs/common';

@Injectable()
export class ReleaseHeatmapEngine {
  compute(runs: any[], insights: any) {
    if (!runs.length) {
      return {
        journeys: [],
        components: [],
        cells: []
      };
    }

    const latest = runs[0];
    const tests = latest.execution?.tests ?? [];

    const journeysSet = new Set<string>();
    const cells: {
      journey: string;
      component: string;
      risk: 'low' | 'medium' | 'high';
      score: number;
    }[] = [];

    const recurringIds = new Set(
      insights.recurringFailures.map((f: any) => f.testId)
    );
    const flakyIds = new Set(
      insights.flakyTests.map((f: any) => f.testId)
    );
    const slowIds = new Set(
      insights.slowestJourneys.map((j: any) => j.journeyId)
    );

    for (const t of tests) {
      const journey = t.journey ?? t.id ?? 'unknown';
      journeysSet.add(journey);

      let baseScore = 50;
      if (t.status === 'failed') baseScore += 30;
      if (recurringIds.has(t.id)) baseScore += 10;
      if (flakyIds.has(t.id)) baseScore += 5;
      if (slowIds.has(t.id)) baseScore += 5;

      const score = Math.max(0, Math.min(100, baseScore));

      let risk: 'low' | 'medium' | 'high' = 'low';
      if (score >= 75) risk = 'high';
      else if (score >= 50) risk = 'medium';

      cells.push({
        journey,
        component: 'ui',
        risk,
        score
      });
    }

    const journeys = Array.from(journeysSet);

    return {
      journeys,
      components: [],
      cells
    };
  }
}
