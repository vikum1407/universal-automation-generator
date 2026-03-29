import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { PrioritizationItem } from "../api/types";

export function useIntelligentPrioritization() {
  const [data, setData] = useState<PrioritizationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getIntelligentPrioritization().then((value: unknown) => {
      setData(value as PrioritizationItem[]);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
