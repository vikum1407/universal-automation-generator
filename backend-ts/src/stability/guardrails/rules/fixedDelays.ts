import { GuardrailIssue } from "../types";

export function fixedDelayRule(context: any): GuardrailIssue[] {
  const issues: GuardrailIssue[] = [];

  for (const test of context.testFiles || []) {
    if (test.content.match(/wait\(\d+\)|sleep\(\d+\)/)) {
      issues.push({
        type: "fixed_delay",
        level: "violation",
        test: test.name,
        message: `Fixed delay detected in ${test.name}`
      });
    }
  }

  return issues;
}
