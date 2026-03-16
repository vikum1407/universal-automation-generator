import { useState, useEffect } from "react";

export type GuardrailStatus = "healthy" | "warning" | "critical";

export interface GuardrailViolation {
  type: string;
  component?: string;
  module?: string;
  message: string;
}

export interface GuardrailWarning {
  type: string;
  component?: string;
  module?: string;
  message: string;
}

export interface StabilityGuardrails {
  status: GuardrailStatus;
  violations: GuardrailViolation[];
  warnings: GuardrailWarning[];
}

export function useStabilityGuardrails(project: string) {
  const [data, setData] = useState<StabilityGuardrails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `/dashboard/projects/${encodeURIComponent(
        project
      )}/stability/guardrails`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<StabilityGuardrails>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
        setLoading(false);
      });
  }, [project]);

  return { data, loading, error };
}
