import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { AIQueryRewrite } from "../api/types";

export function useAIQueryRewrite(query: string) {
  const [data, setData] = useState<AIQueryRewrite | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      return;
    }

    AnalyticsAPI.aiRewriteQuery(query).then((value: unknown) => {
      setData(value as AIQueryRewrite);
    });
  }, [query]);

  return { data };
}
