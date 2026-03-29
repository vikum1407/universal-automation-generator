import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ProjectHotspot } from "../api/types";

export function useProjectHotspots(projectId: string) {
  const [data, setData] = useState<ProjectHotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getProjectHotspots(projectId).then((value: unknown) => {
      setData(value as ProjectHotspot[]);
      setLoading(false);
    });
  }, [projectId]);

  return { data, loading };
}
