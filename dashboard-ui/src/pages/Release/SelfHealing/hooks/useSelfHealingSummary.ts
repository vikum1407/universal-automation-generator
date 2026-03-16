import { useEffect, useState } from 'react';
import type { SelfHealingSummary } from '../types';

export const useSelfHealingSummary = (project: string) => {
  const [data, setData] = useState<SelfHealingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/dashboard/projects/${encodeURIComponent(project)}/self-healing`)
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<SelfHealingSummary>;
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
  }, [project]);

  return { data, loading, error };
};
