import { GuardrailResult } from "./types";
import { selectorBrittlenessRule } from "./rules/selectorBrittleness";
import { fixedDelayRule } from "./rules/fixedDelays";
import { riskSpikeRule } from "./rules/riskSpike";
import { reintroducedFlakyPatternRule } from "./rules/reintroducedFlakyPattern";
import { unstableComponentRule } from "./rules/unstableComponent";
import { predictionAlertRule } from "./rules/predictionAlerts";

export function evaluateGuardrails(context: any): GuardrailResult {
  const rules = [
    selectorBrittlenessRule,
    fixedDelayRule,
    riskSpikeRule,
    reintroducedFlakyPatternRule,
    unstableComponentRule,
    predictionAlertRule
  ];

  const results = rules.flatMap((rule) => rule(context));

  const violations = results.filter((r) => r.level === "violation");
  const warnings = results.filter((r) => r.level === "warning");

  let status: "healthy" | "warning" | "critical" = "healthy";

  if (violations.length > 0) status = "critical";
  else if (warnings.length > 0) status = "warning";

  return {
    status,
    violations,
    warnings
  };
}
