import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { TestImpactItem } from "../api/types";

export function useTestImpactAnalysis() {
  const [data, setData] = useState<TestImpactItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getTestImpactAnalysis().then((value: unknown) => {
      setData(value as TestImpactItem[]);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
