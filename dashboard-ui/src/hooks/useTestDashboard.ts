import { useEffect, useState } from "react";
import type { TestDashboard } from "@/types/test-dashboard";
import { fetchTestDashboard } from "@/api/tests";

export function useTestDashboard(testId: string) {
  const [data, setData] = useState<TestDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    setError(null);

    fetchTestDashboard(testId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [testId]);

  return { data, loading, error };
}
