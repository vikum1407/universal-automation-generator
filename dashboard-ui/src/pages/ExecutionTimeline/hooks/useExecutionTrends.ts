import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3000";

export function useExecutionTrends(project: string) {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/history/${project}/trends`)
      .then(res => res.json())
      .then((data: any) => {
        setTrends(data);
        setLoading(false);
      });
  }, [project]);

  return { trends, loading };
}
