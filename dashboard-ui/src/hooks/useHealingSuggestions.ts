import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { HealingSuggestion } from "../api/types";

export function useHealingSuggestions(runId: string) {
  const [data, setData] = useState<HealingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getHealingSuggestions(runId).then((value: unknown) => {
      setData(value as HealingSuggestion[]);
      setLoading(false);
    });
  }, [runId]);

  return { data, loading };
}
