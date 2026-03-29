import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { FlakinessPoint } from "../api/types";

export function useFlakinessTrend(testId: string) {
  const [data, setData] = useState<FlakinessPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getFlakinessTrend(testId).then((value: unknown) => {
      setData(value as FlakinessPoint[]);
      setLoading(false);
    });
  }, [testId]);

  return { data, loading };
}
