import { useState, useEffect } from "react";

export interface ReleaseReadiness {
  status: "safe" | "risky" | "blocked";
  stabilityScore: number;
  reasons: string[];
  recommendations: string[];
}

export function useReleaseReadiness(project: string) {
  const [data, setData] = useState<ReleaseReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `/dashboard/projects/${encodeURIComponent(
        project
      )}/stability/release-readiness`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ReleaseReadiness>;
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
