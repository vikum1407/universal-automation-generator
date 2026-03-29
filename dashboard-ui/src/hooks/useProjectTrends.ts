import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ProjectTrendPoint } from "../api/types";

export function useProjectTrends(projectId: string) {
  const [data, setData] = useState<ProjectTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getProjectTrends(projectId).then((value: unknown) => {
      setData(value as ProjectTrendPoint[]);
      setLoading(false);
    });
  }, [projectId]);

  return { data, loading };
}
