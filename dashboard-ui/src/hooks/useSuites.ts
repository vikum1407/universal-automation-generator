import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { SuiteOverview } from "../api/types";

export function useSuites() {
  const [data, setData] = useState<SuiteOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getSuites().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
