import { GuardrailIssue } from "../types";

export function unstableComponentRule(context: any): GuardrailIssue[] {
  return (context.nightlyFailures || [])
    .filter((c: any) => c.failureCount >= 2)
    .map((c: any) => ({
      type: "unstable_component",
      level: "warning",
      component: c.component,
      message: `${c.component} failed in ${c.failureCount} nightly runs`
    }));
}
