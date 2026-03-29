import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { TestRankingItem } from "../api/types";

export function useTestRanking() {
  const [data, setData] = useState<TestRankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getTestRanking().then((value: unknown) => {
      setData(value as TestRankingItem[]);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
