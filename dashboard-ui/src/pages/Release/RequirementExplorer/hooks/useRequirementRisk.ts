import { useEffect, useState } from 'react';

export interface RequirementRiskSummary {
  requirement: {
    id: string;
    type: string;
    page?: string;
    url?: string;
    coveredBy?: string[];
  };
  latestStatus: 'passed' | 'failed' | 'not_executed';
  hasCoverage: boolean;
  isAiEnriched: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  lastRunId?: string;
  lastRunTimestamp?: string;
  failureCount: number;
  totalExecutions: number;
  uncoveredRuns: number;
}

export interface GroupedRequirementRisk {
  highRisk: RequirementRiskSummary[];
  failing: RequirementRiskSummary[];
  uncovered: RequirementRiskSummary[];
  api: RequirementRiskSummary[];
  ui: RequirementRiskSummary[];
  aiEnriched: RequirementRiskSummary[];
  all: RequirementRiskSummary[];
}

export const useRequirementRisk = (project: string) => {
  const [data, setData] = useState<GroupedRequirementRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // ✅ FIXED: correct backend route
    fetch(`/dashboard/projects/${encodeURIComponent(project)}/requirements`)
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
          setError(err.message || 'Unknown error');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [project]);

  return { data, loading, error };
};
