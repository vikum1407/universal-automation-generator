import { useEffect, useState } from "react";
import type { StabilitySnapshot } from "../types/StabilitySnapshot";

export function useStabilitySnapshot(project: string) {
  const [data, setData] = useState<StabilitySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    fetch(`/api/projects/${project}/stability`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load stability snapshot");
        setLoading(false);
      });
  }, [project]);

  return { data, loading, error };
}
