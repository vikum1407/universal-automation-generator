import { useState, useEffect } from "react";

export interface StabilityFactor {
  label: string;
  weight: number;
  value: number;
}

export interface StabilityScore {
  score: number;
  grade: string;
  factors: StabilityFactor[];
}

export function useStabilityScore(project: string) {
  const [data, setData] = useState<StabilityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `/dashboard/projects/${encodeURIComponent(
        project
      )}/stability/score`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<StabilityScore>;
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
