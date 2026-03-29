import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { SearchResult } from "../api/types";

export function useSearch(query: string) {
  const [data, setData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setData([]);
      return;
    }

    setLoading(true);

    AnalyticsAPI.search(query).then((value: unknown) => {
      setData(value as SearchResult[]);
      setLoading(false);
    });
  }, [query]);

  return { data, loading };
}
