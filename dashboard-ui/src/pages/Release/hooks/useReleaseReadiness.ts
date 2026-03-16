import { useEffect, useState } from "react";

export type ReleaseReadiness = {
  releaseSummary: {
    readinessScore: number;
    riskScore: number;
    stabilityScore: number;
    coverageScore: number;
    aiSummary: string;
  };
  latestRun: {
    id: string;
    timestamp: string;
    passCount: number;
    failCount: number;
    durationMs: number;
    newFailures: string[];
    fixedTests: string[];
    highRiskJourneys: string[];
  };
  trends: {
    passRateTrend: string;
    failureTrend: string;
    durationTrend: string;
    stabilityTrend: string;
  };
  insights: {
    recurringFailures: string[];
    clusters: string[];
    flakyTests: string[];
    slowJourneys: string[];
  };
  compare: {
    previousRunId: string;
    regressions: string[];
    improvements: string[];
    riskDelta: number;
    stabilityDelta: number;
  };
  aiRecommendation: {
    status: "safe" | "risky" | "blocked";
    detail: string;
    severity: "low" | "medium" | "high";
  };
};

export function useReleaseReadiness(project: string) {
  const [data, setData] = useState<ReleaseReadiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // ✅ Correct backend route for Release Readiness
    fetch(`http://localhost:3000/dashboard/projects/${project}/rrs`)
      .then(res => res.json())
      .then((json: ReleaseReadiness) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [project]);

  return { data, loading };
}
