import { useExecutionData } from "../hooks/useExecutionData";

export function useExecutionInsights(project: string) {
  const { executions, loading, error } = useExecutionData(project);

  if (loading || error) {
    return { insights: [], loading, error };
  }

  const insights: { label: string; value: string }[] = [];

  const recent = executions.slice(0, 5);
  const avgPassRate =
    recent.reduce(
      (acc, r) => acc + r.passed / (r.passed + r.failed + r.flaky),
      0
    ) / recent.length;

  if (avgPassRate < 0.8) {
    insights.push({
      label: "Low recent pass rate",
      value: `${(avgPassRate * 100).toFixed(1)}% over last 5 runs`,
    });
  }

  const flakyRuns = recent.filter((r) => r.flaky > 5);
  if (flakyRuns.length > 0) {
    insights.push({
      label: "High flakiness detected",
      value: `${flakyRuns.length} runs with >5 flaky tests`,
    });
  }

  const slowest = [...recent].sort((a, b) => b.durationMs - a.durationMs)[0];
  if (slowest) {
    insights.push({
      label: "Slowest recent run",
      value: `${(slowest.durationMs / 1000).toFixed(0)}s`,
    });
  }

  return { insights, loading, error };
}
