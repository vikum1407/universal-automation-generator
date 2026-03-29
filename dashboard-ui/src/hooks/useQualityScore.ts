import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { QualityScore } from "../api/types";

export function useQualityScore(testId: string) {
  const [data, setData] = useState<QualityScore | null>(null);

  useEffect(() => {
    AnalyticsAPI.getQualityScore(testId).then((value: unknown) => {
      setData(value as QualityScore);
    });
  }, [testId]);

  return { data };
}
