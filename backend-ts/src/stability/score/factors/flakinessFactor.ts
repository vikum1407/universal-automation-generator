import { StabilityFactor } from "../types";

export function flakinessFactor(context: any): StabilityFactor {
  const flakiness = context.flakinessRate || 0; // 0–1

  return {
    label: "Flakiness",
    weight: 0.30,
    value: 1 - flakiness
  };
}
