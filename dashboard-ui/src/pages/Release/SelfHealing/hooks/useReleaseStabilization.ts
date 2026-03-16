import { useState, useEffect } from "react";

export interface StabilizationAction {
  type: string;
  pipelineId?: string;
  description: string;
}

export interface ReleaseStabilization {
  stabilizationId: string;
  status: "running" | "completed" | "failed";
  actions: StabilizationAction[];
}

export function useReleaseStabilization(project: string, stabilizationId: string) {
  const [data, setData] = useState<ReleaseStabilization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `/dashboard/projects/${encodeURIComponent(
        project
      )}/stability/release-stabilization/${encodeURIComponent(stabilizationId)}`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ReleaseStabilization>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
        setLoading(false);
      });
  }, [project, stabilizationId]);

  return { data, loading, error };
}
