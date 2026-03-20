import { useExecutionData } from "../hooks/useExecutionData";

export function useExecutionTrends(project: string) {
  const { executions, loading, error } = useExecutionData(project);

  const trendPoints = executions.map((run) => ({
    timestamp: run.startedAt,
    passRate: run.passed / (run.passed + run.failed + run.flaky),
    failures: run.failed,
    flaky: run.flaky,
    durationMs: run.durationMs
  }));

  return { trendPoints, loading, error };
}
