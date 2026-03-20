import { useStabilitySnapshot } from "../hooks/useStabilitySnapshot";
import type { ExecutionSummary, HealingSignal } from "../types/StabilitySnapshot";

export function useRunDetails(project: string, runId: string) {
  const { data, loading, error } = useStabilitySnapshot(project);

  if (loading || error || !data) {
    return { run: null, healingSignals: [], loading, error };
  }

  const run: ExecutionSummary | undefined = data.executions.find(
    (r) => r.runId === runId
  );

  const healingSignals: HealingSignal[] = data.selfHealing ?? [];

  return {
    run: run ?? null,
    healingSignals,
    loading,
    error,
  };
}
