import { useState, useEffect } from "react";

interface HealingInsights {
  problemAreas: string[];
  rootCauses: string[];
  effectiveness: string[];
  riskTrends: string[];
  predictions: string[];
}

export function useHealingInsights(project: string) {
  const [data, setData] = useState<HealingInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `/dashboard/projects/${encodeURIComponent(
        project
      )}/self-healing/insights`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HealingInsights>;
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
