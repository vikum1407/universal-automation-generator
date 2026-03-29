import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { CPUProfileNode } from "../api/types";

export function useCPUProfile(runId: string) {
  const [data, setData] = useState<CPUProfileNode | null>(null);

  useEffect(() => {
    AnalyticsAPI.getCPUProfile(runId).then((value: unknown) => {
      setData(value as CPUProfileNode);
    });
  }, [runId]);

  return { data };
}
