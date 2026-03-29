import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { FixDiff } from "../api/types";

export function useFixDiff(runId: string) {
  const [data, setData] = useState<FixDiff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getFixDiff(runId).then((value: unknown) => {
      setData(value as FixDiff);
      setLoading(false);
    });
  }, [runId]);

  return { data, loading };
}
