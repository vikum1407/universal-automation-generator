import { TestsRepository } from "./tests.repository";
import type { TestDashboard, TestRun } from "./tests.types";

export const TestsService = {
  async getDashboard(testId: string): Promise<TestDashboard> {
    const runs = await TestsRepository.loadRuns(testId);
    const latestRun = runs[0] ?? null;

    let detailedLatestRun: TestRun | null = null;

    if (latestRun) {
      detailedLatestRun = {
        ...latestRun,
        assertions: await TestsRepository.loadAssertions(latestRun.run_id),
        logs: await TestsRepository.loadLogs(latestRun.run_id),
        artifacts: await TestsRepository.loadArtifacts(latestRun.run_id),
        error: await TestsRepository.loadError(latestRun.run_id)
      };
    }

    const trends = await TestsRepository.loadTrends(testId);
    const aiInsights = await TestsRepository.loadAiInsights(testId);

    return {
      testId,

      summary: {
        totalRuns: runs.length,
        lastStatus: latestRun?.status ?? "completed",
        lastDurationMs: latestRun?.duration_ms ?? null,
        successRate: calculateSuccessRate(runs),
        failureRate: calculateFailureRate(runs),
        flakinessScore: calculateFlakiness(runs)
      },

      latestRun: detailedLatestRun,

      runs: runs.map((r) => ({
        runId: r.run_id,
        status: r.status,
        startedAt: r.started_at,
        finishedAt: r.finished_at,
        durationMs: r.duration_ms
      })),

      trends: {
        daily: trends
      },

      aiInsights: aiInsights ?? {
        keyFindings: [],
        suggestedFixes: [],
        riskLevel: "P2"
      }
    };
  }
};

function calculateSuccessRate(runs: any[]) {
  const total = runs.length;
  if (!total) return 1;
  const passed = runs.filter((r) => r.status === "completed").length;
  return passed / total;
}

function calculateFailureRate(runs: any[]) {
  const total = runs.length;
  if (!total) return 0;
  const failed = runs.filter((r) => r.status === "failed").length;
  return failed / total;
}

function calculateFlakiness(runs: any[]) {
  if (runs.length < 2) return 0;
  let flips = 0;
  for (let i = 1; i < runs.length; i++) {
    if (runs[i].status !== runs[i - 1].status) flips++;
  }
  return flips / runs.length;
}
