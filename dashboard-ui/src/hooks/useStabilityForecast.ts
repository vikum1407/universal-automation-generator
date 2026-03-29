import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { StabilityForecastPoint } from "../api/types";

export function useStabilityForecast(testId: string) {
  const [data, setData] = useState<StabilityForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getStabilityForecast(testId).then((value: unknown) => {
      setData(value as StabilityForecastPoint[]);
      setLoading(false);
    });
  }, [testId]);

  return { data, loading };
}
