import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { Bottleneck } from "../api/types";

export function useBottlenecks(runId: string) {
  const [data, setData] = useState<Bottleneck[]>([]);

  useEffect(() => {
    AnalyticsAPI.getBottlenecks(runId).then((value: unknown) => {
      setData(value as Bottleneck[]);
    });
  }, [runId]);

  return { data };
}
