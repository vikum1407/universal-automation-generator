import { GuardrailIssue } from "../types";

export function reintroducedFlakyPatternRule(context: any): GuardrailIssue[] {
  const issues: GuardrailIssue[] = [];

  for (const change of context.recentPRDiffs || []) {
    if (context.healedPatterns?.includes(change.pattern)) {
      issues.push({
        type: "reintroduced_flaky_pattern",
        level: "violation",
        component: change.component,
        message: `Previously healed flaky pattern reintroduced: ${change.pattern}`
      });
    }
  }

  return issues;
}
