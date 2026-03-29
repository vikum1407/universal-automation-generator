import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { TestDetail } from "../api/types";

export function useTestDetail(testId: string) {
  const [data, setData] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getTestDetail(testId).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [testId]);

  return { data, loading };
}
