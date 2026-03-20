import { useStabilitySnapshot } from "../hooks/useStabilitySnapshot";

export function useReleaseReadiness(project: string) {
  const { data, loading, error } = useStabilitySnapshot(project);

  if (loading || error || !data) {
    return { readiness: null, loading, error };
  }

  const readiness = {
    score: data.release.readinessScore,
    risk: data.release.riskLevel,
    blockers: data.release.blockers,
    highlights: data.release.highlights,
  };

  return { readiness, loading, error };
}
