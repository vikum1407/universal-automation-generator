import { useState, useEffect } from "react";

export interface StabilityRecommendations {
  codebase: string[];
  tests: string[];
  infrastructure: string[];
  process: string[];
  preventive: string[];
}

export function useStabilityRecommendations(project: string) {
  const [data, setData] = useState<StabilityRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `/dashboard/projects/${encodeURIComponent(
        project
      )}/self-healing/recommendations`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<StabilityRecommendations>;
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
