import { useEffect, useState } from "react";
import type { SuiteDashboard } from "../types/suite-dashboard";
import { fetchSuiteDashboard } from "../api/suites";

export function useSuiteDashboard(suiteId: string) {
  const [data, setData] = useState<SuiteDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchSuiteDashboard(suiteId)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [suiteId]);

  return { data, loading, error };
}
