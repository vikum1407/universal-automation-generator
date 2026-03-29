import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { WorkerNode } from "../api/types";

export function useWorkers() {
  const [data, setData] = useState<WorkerNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getWorkers().then((value: unknown) => {
      setData(value as WorkerNode[]);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
