import { useStabilitySnapshot } from "../hooks/useStabilitySnapshot";
import type {
  ExecutionSummary,
  RequirementStability,
  HealingSignal,
} from "../types/StabilitySnapshot";

export function useReleaseTimeline(project: string) {
  const { data, loading, error } = useStabilitySnapshot(project);

  if (loading || error || !data) {
    return { timeline: null, loading, error };
  }

  const runs: ExecutionSummary[] = [...(data.executions ?? [])].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  const requirements: RequirementStability[] = data.requirements ?? [];
  const healingSignals: HealingSignal[] = data.selfHealing ?? [];

  const timeline = runs.map((run, idx) => {
    const prev = idx > 0 ? runs[idx - 1] : null;

    const deltas = prev
      ? {
          passed: run.passed - prev.passed,
          failed: run.failed - prev.failed,
          flaky: run.flaky - prev.flaky,
          durationMs: run.durationMs - prev.durationMs,
        }
      : null;

    const unstable = requirements.filter((r) => r.status === "unstable");
    const risky = requirements.filter((r) => r.status === "risky");

    const prevUnstable = prev
      ? requirements.filter((r) => r.status === "unstable")
      : [];

    const prevRisky = prev
      ? requirements.filter((r) => r.status === "risky")
      : [];

    const becameUnstable = unstable
      .map((r) => r.requirementId)
      .filter((id) => !prevUnstable.map((r) => r.requirementId).includes(id));

    const becameRisky = risky
      .map((r) => r.requirementId)
      .filter((id) => !prevRisky.map((r) => r.requirementId).includes(id));

    const recovered = prevUnstable
      .map((r) => r.requirementId)
      .filter((id) => !unstable.map((r) => r.requirementId).includes(id));

    return {
      run,
      deltas,
      unstableCount: unstable.length,
      riskyCount: risky.length,
      becameUnstable,
      becameRisky,
      recovered,
      healingSignals,
    };
  });

  return { timeline, loading, error };
}
