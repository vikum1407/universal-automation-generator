import { loadStabilityContext } from "./loadStabilityContext";
import { loadStabilityScoreContext } from "./loadStabilityScoreContext";

export const loadReleaseReadinessContext = async (project: string) => {
  const guardrails = await loadStabilityContext(project);
  const stabilityScore = await loadStabilityScoreContext(project);

  return {
    ...guardrails,
    stabilityScore,
    recentPipelineFailures: []
  };
};
