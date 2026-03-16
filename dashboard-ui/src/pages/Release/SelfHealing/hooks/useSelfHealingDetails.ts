import { useEffect, useState } from 'react';
import type { SelfHealingSuggestion } from '../types';

interface SelfHealingDetailsResponse {
  suggestion: SelfHealingSuggestion;
}

export const useSelfHealingDetails = (project: string, suggestionId: string) => {
  const [data, setData] = useState<SelfHealingDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `/dashboard/projects/${encodeURIComponent(project)}/self-healing/${encodeURIComponent(
        suggestionId
      )}`
    )
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<SelfHealingDetailsResponse>;
      })
      .then(json => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Unknown error');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [project, suggestionId]);

  return { data, loading, error };
};
