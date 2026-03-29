import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { FailureCorrelationEdge } from "../api/types";

export function useFailureCorrelation(testId: string) {
  const [data, setData] = useState<FailureCorrelationEdge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getFailureCorrelation(testId).then((value: unknown) => {
      setData(value as FailureCorrelationEdge[]);
      setLoading(false);
    });
  }, [testId]);

  return { data, loading };
}
