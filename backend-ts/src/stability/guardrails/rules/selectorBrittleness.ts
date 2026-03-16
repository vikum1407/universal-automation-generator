import { GuardrailIssue } from "../types";

function isBrittle(selector: string): boolean {
  return (
    selector.includes("nth-child") ||
    selector.includes(">") ||
    selector.includes(" ") ||
    selector.includes("[class=") ||
    selector.includes("text=")
  );
}

export function selectorBrittlenessRule(context: any): GuardrailIssue[] {
  const issues: GuardrailIssue[] = [];

  for (const change of context.recentPRDiffs || []) {
    if (change.selector && isBrittle(change.selector)) {
      issues.push({
        type: "selector_brittleness",
        level: "violation",
        component: change.component,
        message: `Brittle selector detected: ${change.selector}`
      });
    }
  }

  return issues;
}
