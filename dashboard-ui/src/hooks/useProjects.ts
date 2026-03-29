import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ProjectInfo } from "../api/types";

export function useProjects() {
  const [data, setData] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getProjects().then((value: unknown) => {
      setData(value as ProjectInfo[]);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
