import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ReplayStep } from "../api/types";

export function useReplaySteps(runId: string) {
  const [data, setData] = useState<ReplayStep[]>([]);

  useEffect(() => {
    AnalyticsAPI.getReplaySteps(runId).then((value: unknown) => {
      setData(value as ReplayStep[]);
    });
  }, [runId]);

  return { data };
}
