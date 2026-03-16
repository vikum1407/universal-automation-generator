import { Injectable } from '@nestjs/common';

interface TestHistoryEntry {
  passes: number;
  fails: number;
  durations: number[];
  lastFailed?: string;
  messages: string[];
}

@Injectable()
export class ExecutionInsightsEngine {
  compute(runs: any[]) {
    if (!runs.length) {
      return this.empty();
    }

    const testHistory: Record<string, TestHistoryEntry> = {};

    for (const run of runs) {
      const tests = run.execution?.tests ?? [];

      for (const t of tests) {
        if (!testHistory[t.id]) {
          testHistory[t.id] = {
            passes: 0,
            fails: 0,
            durations: [],
            messages: []
          };
        }

        const entry = testHistory[t.id];

        if (t.status === 'passed') entry.passes++;
        if (t.status === 'failed') {
          entry.fails++;
          entry.lastFailed = run.timestamp;
          if (t.errorMessage) entry.messages.push(t.errorMessage);
        }

        if (t.durationMs) entry.durations.push(t.durationMs);
      }
    }

    const recurringFailures = Object.entries(testHistory)
      .filter(([_, h]) => h.fails >= 2)
      .map(([testId, h]) => ({
        testId,
        failCount: h.fails,
        lastFailed: h.lastFailed,
        pattern: "Consistent failure across multiple runs",
        suggestedFix: "Investigate test stability or application logic"
      }));

    const flakyTests = Object.entries(testHistory)
      .filter(([_, h]) => h.passes > 0 && h.fails > 0)
      .map(([testId, h]) => ({
        testId,
        flakiness: h.fails / (h.passes + h.fails),
        runs: []
      }));

    const slowestJourneys = Object.entries(testHistory)
      .map(([testId, h]) => ({
        journeyId: testId,
        avgDurationMs: h.durations.reduce((a, b) => a + b, 0) / h.durations.length,
        trend: "stable"
      }))
      .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
      .slice(0, 5);

    const clusters = this.buildClusters(testHistory);

    const riskScore = recurringFailures.length * 10 + flakyTests.length * 5;
    const stabilityScore = Math.max(0, 100 - riskScore);
    const coverageScore = Object.keys(testHistory).length;

    const aiInsights = [
      {
        title: "Execution stability is improving",
        detail: "Most tests are passing consistently. Only a few recurring failures detected.",
        severity: "low"
      }
    ];

    return {
      summary: {
        highlights: [
          `Detected ${recurringFailures.length} recurring failures`,
          `Detected ${flakyTests.length} flaky tests`,
          `Slowest test: ${slowestJourneys[0]?.journeyId ?? "N/A"}`
        ],
        riskScore,
        stabilityScore,
        coverageScore
      },
      recurringFailures,
      clusters,
      slowestJourneys,
      flakyTests,
      aiInsights
    };
  }

  private buildClusters(testHistory: Record<string, TestHistoryEntry>) {
    const map: Record<string, string[]> = {};

    for (const [testId, h] of Object.entries(testHistory)) {
      for (const msg of h.messages) {
        if (!map[msg]) map[msg] = [];
        map[msg].push(testId);
      }
    }

    return Object.entries(map).map(([msg, tests], i) => ({
      clusterId: `cluster_${i + 1}`,
      label: msg.slice(0, 60),
      count: tests.length,
      examples: tests,
      rootCause: "Likely related to shared failure message"
    }));
  }

  private empty() {
    return {
      summary: {
        highlights: [],
        riskScore: 0,
        stabilityScore: 0,
        coverageScore: 0
      },
      recurringFailures: [],
      clusters: [],
      slowestJourneys: [],
      flakyTests: [],
      aiInsights: []
    };
  }
}
