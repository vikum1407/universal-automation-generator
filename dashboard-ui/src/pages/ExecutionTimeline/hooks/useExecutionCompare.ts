import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3000";

export type ExecutionCompareResponse = {
  runA: {
    id: string;
    timestamp: string;
    passCount: number;
    failCount: number;
    durationMs: number;
    riskScore: number;
    stabilityScore: number;
  };
  runB: {
    id: string;
    timestamp: string;
    passCount: number;
    failCount: number;
    durationMs: number;
    riskScore: number;
    stabilityScore: number;
  };
  testDiff: {
    fixed: string[];
    regressed: string[];
    newFailures: string[];
    newPasses: string[];
  };
  journeyDiff: {
    journeyId: string;
    durationA: number;
    durationB: number;
    statusA: string;
    statusB: string;
  }[];
  aiInsights: {
    title: string;
    detail: string;
    severity: "low" | "medium" | "high";
  }[];
};

export function useExecutionCompare(
  project: string,
  runA: string,
  runB: string
) {
  const [data, setData] = useState<ExecutionCompareResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!runA || !runB) return;
    setLoading(true);
    fetch(`${API_BASE}/history/${project}/compare?runA=${runA}&runB=${runB}`)
      .then(res => res.json())
      .then((json: ExecutionCompareResponse) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [project, runA, runB]);

  return { data, loading };
}
