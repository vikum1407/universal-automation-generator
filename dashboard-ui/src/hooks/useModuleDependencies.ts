import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ModuleDependency } from "../api/types";

export function useModuleDependencies(runId: string) {
  const [data, setData] = useState<ModuleDependency[]>([]);

  useEffect(() => {
    AnalyticsAPI.getModuleDependencies(runId).then((value: unknown) => {
      setData(value as ModuleDependency[]);
    });
  }, [runId]);

  return { data };
}
