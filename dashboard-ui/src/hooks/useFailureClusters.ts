import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { FailureCluster } from "../api/types";

export function useFailureClusters(testId: string) {
  const [data, setData] = useState<FailureCluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getFailureClusters(testId).then((value: unknown) => {
      setData(value as FailureCluster[]);
      setLoading(false);
    });
  }, [testId]);

  return { data, loading };
}
