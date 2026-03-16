import { loadStabilityContext } from "./loadStabilityContext";

export const loadStabilityScoreContext = async (project: string) => {
  const guardrails = await loadStabilityContext(project);

  return {
    flakinessRate: 0,
    avgRisk: 0,
    healingEffectiveness: 0,
    guardrails
  };
};
