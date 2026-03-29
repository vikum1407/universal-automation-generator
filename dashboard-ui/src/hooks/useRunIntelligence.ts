import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { RunIntelligence } from "../api/types";

export function useRunIntelligence(runId: string) {
  const [data, setData] = useState<RunIntelligence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getRunIntelligence(runId).then((value: unknown) => {
      setData(value as RunIntelligence);
      setLoading(false);
    });
  }, [runId]);

  return { data, loading };
}
