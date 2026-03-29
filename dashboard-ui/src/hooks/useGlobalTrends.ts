import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { GlobalTrendPoint } from "../api/types";

export function useGlobalTrends() {
  const [data, setData] = useState<GlobalTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getGlobalTrends().then((value: unknown) => {
      setData(value as GlobalTrendPoint[]);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
