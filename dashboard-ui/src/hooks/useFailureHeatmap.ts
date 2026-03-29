import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { HeatmapCell } from "../api/types";

export function useFailureHeatmap(testId: string) {
  const [data, setData] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getFailureHeatmap(testId).then((value: unknown) => {
      setData(value as HeatmapCell[]);
      setLoading(false);
    });
  }, [testId]);

  return { data, loading };
}
