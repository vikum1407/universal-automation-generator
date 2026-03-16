import { useState, useEffect } from "react";

interface NightlyRun {
  id: string;
  startedAt: string;
  completedAt: string;
  pipelineId: string | null;
  summary: {
    total: number;
    merged: number;
    failed: number;
    blocked: number;
  };
}

interface NightlyRunsResponse {
  runs: NightlyRun[];
}

export function useNightlyHealingRuns(project: string) {
  const [data, setData] = useState<NightlyRunsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `/dashboard/projects/${encodeURIComponent(
        project
      )}/self-healing/nightly-runs`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<NightlyRunsResponse>;
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
