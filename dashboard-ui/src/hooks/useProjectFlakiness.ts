import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ProjectFlakinessPoint } from "../api/types";

export function useProjectFlakiness(projectId: string) {
  const [data, setData] = useState<ProjectFlakinessPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getProjectFlakiness(projectId).then((value: unknown) => {
      setData(value as ProjectFlakinessPoint[]);
      setLoading(false);
    });
  }, [projectId]);

  return { data, loading };
}
