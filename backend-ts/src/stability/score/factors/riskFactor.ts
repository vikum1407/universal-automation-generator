import { StabilityFactor } from "../types";

export function riskFactor(context: any): StabilityFactor {
  const risk = context.avgRisk || 0; // 0–1

  return {
    label: "Risk",
    weight: 0.30,
    value: 1 - risk
  };
}
