import { useStabilitySnapshot } from "../hooks/useStabilitySnapshot";
import type { RequirementStability } from "../types/StabilitySnapshot";

export function useRequirementStability(project: string) {
  const { data, loading, error } = useStabilitySnapshot(project);

  const requirements: RequirementStability[] = data?.requirements ?? [];

  return { requirements, loading, error };
}
