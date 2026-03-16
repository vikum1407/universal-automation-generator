import { useState, useEffect } from "react";

export interface PipelineStep {
  suggestionId: string;
  prUrl: string | null;
  status: "pending" | "open" | "merged" | "failed";
}

export interface Pipeline {
  pipelineId: string;
  mode: "parallel" | "sequential" | "batched";
  status: "running" | "completed" | "failed" | "partial";
  steps: PipelineStep[];
}

export function useSelfHealingPipeline(project: string, pipelineId: string) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchStatus = () => {
      fetch(
        `/dashboard/projects/${encodeURIComponent(
          project
        )}/self-healing/pipeline/${encodeURIComponent(pipelineId)}`
      )
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<Pipeline>;
        })
        .then((json) => {
          if (!active) return;
          setPipeline(json);
          setLoading(false);
        })
        .catch((err) => {
          if (!active) return;
          setError(err.message || "Unknown error");
          setLoading(false);
        });
    };

    fetchStatus();

    const poll = setInterval(() => {
      if (pipeline?.status === "completed" || pipeline?.status === "failed") {
        clearInterval(poll);
        return;
      }
      fetchStatus();
    }, 12000);

    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [project, pipelineId, pipeline?.status]);

  return { pipeline, loading, error };
}
