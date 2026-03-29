import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { FailureHotspot } from "../api/types";

export function useFailureHotspots() {
  const [data, setData] = useState<FailureHotspot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getFailureHotspots().then((value: unknown) => {
      setData(value as FailureHotspot[]);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
