import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { AIEdgeCase } from "../api/types";

export function useAIEdgeCases(testId: string) {
  const [data, setData] = useState<AIEdgeCase[]>([]);

  useEffect(() => {
    AnalyticsAPI.getAIEdgeCases(testId).then((value: unknown) => {
      setData(value as AIEdgeCase[]);
    });
  }, [testId]);

  return { data };
}
