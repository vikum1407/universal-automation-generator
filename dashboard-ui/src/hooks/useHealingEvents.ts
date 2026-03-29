import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { HealingEvent } from "../api/types";

export function useHealingEvents(runId: string) {
  const [data, setData] = useState<HealingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getHealingEvents(runId).then((value: unknown) => {
      setData(value as HealingEvent[]);
      setLoading(false);
    });
  }, [runId]);

  return { data, loading };
}
