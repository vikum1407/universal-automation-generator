import { StabilityScoreResult } from "./types";
import { flakinessFactor } from "./factors/flakinessFactor";
import { riskFactor } from "./factors/riskFactor";
import { healingEffectivenessFactor } from "./factors/healingEffectivenessFactor";
import { guardrailFactor } from "./factors/guardrailFactor";
import { mapScoreToGrade } from "./grade";

export function evaluateStabilityScore(context: any): StabilityScoreResult {
  const factors = [
    flakinessFactor(context),
    riskFactor(context),
    healingEffectivenessFactor(context),
    guardrailFactor(context)
  ];

  const score = factors.reduce(
    (sum, f) => sum + f.value * f.weight,
    0
  );

  return {
    score,
    grade: mapScoreToGrade(score),
    factors
  };
}
