import { StabilityFactor } from "../types";

export function healingEffectivenessFactor(context: any): StabilityFactor {
  const effectiveness = context.healingEffectiveness || 0.8; // default 80%

  return {
    label: "Healing Effectiveness",
    weight: 0.20,
    value: effectiveness
  };
}
