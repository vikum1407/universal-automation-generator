import { useState, useEffect } from "react";

interface Suggestion {
  id: string;
  summary: string;
  details: string;
}

interface ListResponse {
  suggestions: Suggestion[];
}

export function useSelfHealingList(project: string) {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `/dashboard/projects/${encodeURIComponent(project)}/self-healing`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ListResponse>;
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
