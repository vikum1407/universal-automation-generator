import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { WorkerEvent } from "../api/types";

export function useWorkerEvents() {
  const [data, setData] = useState<WorkerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getWorkerEvents().then((value: unknown) => {
      setData(value as WorkerEvent[]);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
