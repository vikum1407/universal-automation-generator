import { useState, useCallback, useEffect } from 'react';

interface PRMetadata {
  branch: string;
  commit: string;
  prUrl: string;
  status: "open" | "merged" | "closed";
}

export function useApplySelfHealingFix(project: string, suggestionId: string) {
  const [pr, setPr] = useState<PRMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyFix = useCallback(
    (patch: string) => {
      setLoading(true);
      setError(null);

      fetch(
        `/dashboard/projects/${encodeURIComponent(project)}/self-healing/${encodeURIComponent(
          suggestionId
        )}/apply-fix`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patch })
        }
      )
        .then(async res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<PRMetadata>;
        })
        .then(json => {
          setPr(json);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || "Unknown error");
          setLoading(false);
        });
    },
    [project, suggestionId]
  );

  useEffect(() => {
    if (!pr || pr.status !== "open") return;

    const poll = setInterval(() => {
      fetch(
        `/dashboard/projects/${encodeURIComponent(project)}/self-healing/${encodeURIComponent(
          suggestionId
        )}/pr-status`
      )
        .then(async res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<PRMetadata>;
        })
        .then(json => {
          setPr(json);
          if (json.status !== "open") clearInterval(poll);
        })
        .catch(() => {});
    }, 12000);

    return () => clearInterval(poll);
  }, [pr, project, suggestionId]);

  return { applyFix, pr, loading, error };
}
