import { useStabilitySnapshot } from "../hooks/useStabilitySnapshot";
import type {
  RequirementStability,
  HealingSignal,
  ExecutionSummary,
} from "../types/StabilitySnapshot";

export function useTestLevelDiff(
  project: string,
  runA: string,
  runB: string
) {
  const { data, loading, error } = useStabilitySnapshot(project);

  if (loading || error || !data) {
    return { diff: null, loading, error };
  }

  const runs = data.executions ?? [];
  const a: ExecutionSummary | undefined = runs.find((r) => r.runId === runA);
  const b: ExecutionSummary | undefined = runs.find((r) => r.runId === runB);

  if (!a || !b) {
    return { diff: null, loading, error };
  }

  const requirements: RequirementStability[] = data.requirements ?? [];
  const healingSignals: HealingSignal[] = data.selfHealing ?? [];

  const unstableA = new Set(
    requirements.filter((r) => r.status === "unstable").map((r) => r.requirementId)
  );

  const unstableB = new Set(
    requirements.filter((r) => r.status === "unstable").map((r) => r.requirementId)
  );

  const becameUnstable = [...unstableB].filter((id) => !unstableA.has(id));
  const becameStable = [...unstableA].filter((id) => !unstableB.has(id));

  const diff = {
    becameUnstable,
    becameStable,
    healingSignals,
  };

  return { diff, loading, error };
}
