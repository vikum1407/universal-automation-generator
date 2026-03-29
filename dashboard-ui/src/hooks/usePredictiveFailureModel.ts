import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { PredictiveFailurePoint } from "../api/types";

export function usePredictiveFailureModel() {
  const [data, setData] = useState<PredictiveFailurePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getPredictiveFailureModel().then((value: unknown) => {
      setData(value as PredictiveFailurePoint[]);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
