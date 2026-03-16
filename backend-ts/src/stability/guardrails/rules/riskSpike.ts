import { GuardrailIssue } from "../types";

export function riskSpikeRule(context: any): GuardrailIssue[] {
  return (context.riskTrends || [])
    .filter((r: any) => r.increasingStreak >= 3)
    .map((r: any) => ({
      type: "risk_increase",
      level: "warning",
      module: r.module,
      message: `Risk has increased for ${r.increasingStreak} nights`
    }));
}
