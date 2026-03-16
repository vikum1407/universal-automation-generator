import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3000";

export type ExecutionInsights = {
  summary: {
    highlights: string[];
    riskScore: number;
    stabilityScore: number;
    coverageScore: number;
  };
  recurringFailures: {
    testId: string;
    failCount: number;
    lastFailed?: string;
    pattern: string;
    suggestedFix?: string;
  }[];
  clusters: {
    clusterId: string;
    label: string;
    count: number;
    examples: string[];
    rootCause?: string;
  }[];
  slowestJourneys: {
    journeyId: string;
    avgDurationMs: number;
    trend: string;
  }[];
  flakyTests: {
    testId: string;
    flakiness: number;
    runs: string[];
  }[];
  aiInsights: {
    title: string;
    detail: string;
    severity: "low" | "medium" | "high";
  }[];
};

export function useExecutionInsights(project: string) {
  const [insights, setInsights] = useState<ExecutionInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/dashboard/projects/${project}/insights`)
      .then(res => res.json())
      .then((data: ExecutionInsights) => {
        setInsights(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [project]);

  return { insights, loading };
}
