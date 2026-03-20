import { useStabilitySnapshot } from "../hooks/useStabilitySnapshot";
import type {
  RequirementStability,
  ExecutionSummary,
} from "../types/StabilitySnapshot";

export function useRequirementDetails(project: string, requirementId: string) {
  const { data, loading, error } = useStabilitySnapshot(project);

  if (loading || error || !data) {
    return { requirement: null, executions: [], loading, error };
  }

  const requirement: RequirementStability | undefined =
    data.requirements.find((r) => r.requirementId === requirementId);

  const executions: ExecutionSummary[] = data.executions ?? [];

  return {
    requirement: requirement ?? null,
    executions,
    loading,
    error,
  };
}
