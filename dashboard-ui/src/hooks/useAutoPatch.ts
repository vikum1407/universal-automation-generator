import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { AutoPatch } from "../api/types";

export function useAutoPatch(runId: string) {
  const [data, setData] = useState<AutoPatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getAutoPatch(runId).then((value: unknown) => {
      setData(value as AutoPatch);
      setLoading(false);
    });
  }, [runId]);

  return { data, loading };
}
