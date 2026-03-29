import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { MemoryPoint } from "../api/types";

export function useMemoryTimeline(runId: string) {
  const [data, setData] = useState<MemoryPoint[]>([]);

  useEffect(() => {
    AnalyticsAPI.getMemoryTimeline(runId).then((value: unknown) => {
      setData(value as MemoryPoint[]);
    });
  }, [runId]);

  return { data };
}
