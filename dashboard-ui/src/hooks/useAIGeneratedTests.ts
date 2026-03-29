import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { AIGeneratedTest } from "../api/types";

export function useAIGeneratedTests(testId: string) {
  const [data, setData] = useState<AIGeneratedTest[]>([]);

  useEffect(() => {
    AnalyticsAPI.getAIGeneratedTests(testId).then((value: unknown) => {
      setData(value as AIGeneratedTest[]);
    });
  }, [testId]);

  return { data };
}
