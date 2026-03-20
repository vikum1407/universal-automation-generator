import { useStabilitySnapshot } from "../hooks/useStabilitySnapshot";
import type { ExecutionSummary } from "../types/StabilitySnapshot";

export function useExecutionData(project: string) {
  const { data, loading, error } = useStabilitySnapshot(project);
  const executions: ExecutionSummary[] = data?.executions ?? [];
  return { executions, loading, error };
}
