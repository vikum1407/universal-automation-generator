import { useStabilitySnapshot } from "../hooks/useStabilitySnapshot";
import type { ExecutionSummary, HealingSignal } from "../types/StabilitySnapshot";

export function useRunComparison(
  project: string,
  runA: string,
  runB: string
) {
  const { data, loading, error } = useStabilitySnapshot(project);

  if (loading || error || !data) {
    return { comparison: null, loading, error };
  }

  const runs = data.executions ?? [];
  const a: ExecutionSummary | undefined = runs.find((r) => r.runId === runA);
  const b: ExecutionSummary | undefined = runs.find((r) => r.runId === runB);

  if (!a || !b) {
    return { comparison: null, loading, error };
  }

  const healingSignals: HealingSignal[] = data.selfHealing ?? [];

  const comparison = {
    a,
    b,
    deltas: {
      passed: b.passed - a.passed,
      failed: b.failed - a.failed,
      flaky: b.flaky - a.flaky,
      durationMs: b.durationMs - a.durationMs,
    },
    healingSignals,
  };

  return { comparison, loading, error };
}
