import { StabilityFactor } from "../types";

export function guardrailFactor(context: any): StabilityFactor {
  const violations = context.guardrails?.violations?.length || 0;
  const warnings = context.guardrails?.warnings?.length || 0;

  let penalty = 0;

  if (violations > 0) penalty = 0.4;
  else if (warnings > 0) penalty = 0.2;

  return {
    label: "Guardrail Compliance",
    weight: 0.20,
    value: 1 - penalty
  };
}
