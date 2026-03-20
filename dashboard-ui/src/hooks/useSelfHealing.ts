import { useStabilitySnapshot } from "../hooks/useStabilitySnapshot";
import type { HealingSignal } from "../types/StabilitySnapshot";

export function useSelfHealing(project: string) {
  const { data, loading, error } = useStabilitySnapshot(project);

  const healingSignals: HealingSignal[] = data?.selfHealing ?? [];

  return { healingSignals, loading, error };
}
