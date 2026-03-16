import { useEffect, useState } from "react";
import type { RequirementRiskSummary } from "./useRequirementRisk";

export interface RequirementHistoryPoint {
  runId: string;
  timestamp: string;
  status: "passed" | "failed" | "not_executed";
  hasCoverage: boolean;
  riskScore: number;
}

export interface RequirementHistory {
  requirementId: string;
  points: RequirementHistoryPoint[];
}

export interface RequirementPattern {
  requirementId: string;
  recurringFailures: boolean;
  failureCount: number;
  totalExecutions: number;
  longUncovered: boolean;
  uncoveredRuns: number;
  isApiHotspot: boolean;
  isUiHotspot: boolean;
}

export interface RequirementFixSuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface RequirementDetailsResponse {
  requirementId: string;
  risk: RequirementRiskSummary | null;
  history: RequirementHistory;
  patterns: RequirementPattern;
  fixes: RequirementFixSuggestion[];
}

export function useRequirementDetails(project: string, requirementId: string) {
  const [data, setData] = useState<RequirementDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // ✅ FIXED: correct backend route
    fetch(`/dashboard/projects/${project}/requirements/${requirementId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Unknown error");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [project, requirementId]);

  return { data, loading, error };
}
