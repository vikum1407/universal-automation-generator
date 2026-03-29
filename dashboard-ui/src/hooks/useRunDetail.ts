import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { RunDetail } from "../api/types";

export function useRunDetail(runId: string) {
  const [data, setData] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getRunDetail(runId).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [runId]);

  return { data, loading };
}
