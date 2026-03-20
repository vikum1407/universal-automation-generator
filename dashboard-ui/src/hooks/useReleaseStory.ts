import { useStabilitySnapshot } from "../hooks/useStabilitySnapshot";
import type {
  RequirementStability,
  HealingSignal,
} from "../types/StabilitySnapshot";

export function useReleaseStory(project: string) {
  const { data, loading, error } = useStabilitySnapshot(project);

  if (loading || error || !data) {
    return { story: null, loading, error };
  }

  const executions = data.executions;
  const requirements: RequirementStability[] = data.requirements ?? [];
  const healingSignals: HealingSignal[] = data.selfHealing ?? [];

  const recent = executions.slice(0, 5);

  const avgPassRate =
    recent.length === 0
      ? 1
      : recent.reduce(
          (acc, r) => acc + r.passed / (r.passed + r.failed + r.flaky),
          0
        ) / recent.length;

  const unstableReqs = requirements.filter((r) => r.status === "unstable");
  const riskyReqs = requirements.filter((r) => r.status === "risky");

  const story = {
    avgPassRate,
    unstableReqs,
    riskyReqs,
    healingSignals,
  };

  return { story, loading, error };
}
