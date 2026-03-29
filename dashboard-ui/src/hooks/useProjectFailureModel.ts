import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ProjectFailureModelPoint } from "../api/types";

export function useProjectFailureModel(projectId: string) {
  const [data, setData] = useState<ProjectFailureModelPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getProjectFailureModel(projectId).then((value: unknown) => {
      setData(value as ProjectFailureModelPoint[]);
      setLoading(false);
    });
  }, [projectId]);

  return { data, loading };
}
