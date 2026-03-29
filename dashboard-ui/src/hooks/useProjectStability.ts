import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ProjectStabilityPoint } from "../api/types";

export function useProjectStability(projectId: string) {
  const [data, setData] = useState<ProjectStabilityPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getProjectStability(projectId).then((value: unknown) => {
      setData(value as ProjectStabilityPoint[]);
      setLoading(false);
    });
  }, [projectId]);

  return { data, loading };
}
