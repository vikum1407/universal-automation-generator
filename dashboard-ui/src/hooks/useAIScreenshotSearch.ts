import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { AIScreenshotResult } from "../api/types";

export function useAIScreenshotSearch(query: string) {
  const [data, setData] = useState<AIScreenshotResult[]>([]);

  useEffect(() => {
    if (!query) {
      setData([]);
      return;
    }

    AnalyticsAPI.aiScreenshotSearch(query).then((value: unknown) => {
      setData(value as AIScreenshotResult[]);
    });
  }, [query]);

  return { data };
}
