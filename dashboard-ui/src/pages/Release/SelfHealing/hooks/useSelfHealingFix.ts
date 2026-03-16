import { useEffect, useState, useCallback } from 'react';

interface SelfHealingFix {
  patch: string;
  confidence: number;
  explanation: string;
}

interface FixResponse {
  fix?: SelfHealingFix | null;
}

export const useSelfHealingFix = (project: string, suggestionId: string) => {
  const [data, setData] = useState<SelfHealingFix | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFix = useCallback(() => {
    return fetch(
      `/dashboard/projects/${encodeURIComponent(project)}/self-healing/${encodeURIComponent(
        suggestionId
      )}/fix`
    )
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<FixResponse>;
      })
      .then(json => {
        setData(json.fix ?? null);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Unknown error');
        setLoading(false);
      });
  }, [project, suggestionId]);

  useEffect(() => {
    setLoading(true);
    fetchFix();
  }, [fetchFix]);

  const generateFix = useCallback(() => {
    setGenerating(true);
    setError(null);

    fetch(
      `/dashboard/projects/${encodeURIComponent(project)}/self-healing/${encodeURIComponent(
        suggestionId
      )}/fix`,
      { method: 'POST' }
    )
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => {
        const poll = setInterval(() => {
          fetchFix().then(() => {
            if (data) {
              clearInterval(poll);
              setGenerating(false);
            }
          });
        }, 1500);
      })
      .catch(err => {
        setError(err.message || 'Unknown error');
        setGenerating(false);
      });
  }, [project, suggestionId, fetchFix, data]);

  return { data, loading, generating, error, generateFix };
};
