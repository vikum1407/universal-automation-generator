import { GuardrailIssue } from "../types";

export function predictionAlertRule(context: any): GuardrailIssue[] {
  return (context.predictions || [])
    .filter((p: any) => p.confidence > 0.7)
    .map((p: any) => ({
      type: "predicted_failure",
      level: "warning",
      component: p.component,
      message: `Predicted failure likely in ${p.component}`
    }));
}
