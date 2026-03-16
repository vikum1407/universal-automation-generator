export type GuardrailLevel = "violation" | "warning";

export interface GuardrailIssue {
  type: string;
  level: GuardrailLevel;
  message: string;
  component?: string;
  module?: string;
  test?: string;
  pattern?: string;
}

export interface GuardrailResult {
  status: "healthy" | "warning" | "critical";
  violations: GuardrailIssue[];
  warnings: GuardrailIssue[];
}
