import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { NetworkDependency } from "../api/types";

export function useNetworkDependencies(runId: string) {
  const [data, setData] = useState<NetworkDependency[]>([]);

  useEffect(() => {
    AnalyticsAPI.getNetworkDependencies(runId).then((value: unknown) => {
      setData(value as NetworkDependency[]);
    });
  }, [runId]);

  return { data };
}
