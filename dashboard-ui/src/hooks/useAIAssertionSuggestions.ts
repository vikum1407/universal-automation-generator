import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { AIAssertionSuggestion } from "../api/types";

export function useAIAssertionSuggestions(testId: string) {
  const [data, setData] = useState<AIAssertionSuggestion[]>([]);

  useEffect(() => {
    AnalyticsAPI.getAIAssertionSuggestions(testId).then((value: unknown) => {
      setData(value as AIAssertionSuggestion[]);
    });
  }, [testId]);

  return { data };
}
