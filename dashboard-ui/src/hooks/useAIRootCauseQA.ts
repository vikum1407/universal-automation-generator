import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { AIRootCauseAnswer } from "../api/types";

export function useAIRootCauseQA(query: string) {
  const [data, setData] = useState<AIRootCauseAnswer | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      return;
    }

    AnalyticsAPI.aiRootCauseQA(query).then((value: unknown) => {
      setData(value as AIRootCauseAnswer);
    });
  }, [query]);

  return { data };
}
