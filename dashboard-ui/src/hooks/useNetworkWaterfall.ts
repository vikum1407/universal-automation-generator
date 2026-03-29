import { useMemo } from "react";
import type { TimelineEvent } from "../api/types";

export function useNetworkWaterfall(events: TimelineEvent[]) {
  return useMemo(() => {
    return events
      .filter((e) => e.event_type === "network")
      .map((e) => ({
        id: e.id,
        url: e.payload.url,
        method: e.payload.method,
        status: e.payload.status,
        start: new Date(e.payload.started_at).getTime(),
        end: new Date(e.payload.finished_at).getTime(),
        duration: e.payload.duration_ms
      }))
      .sort((a, b) => a.start - b.start);
  }, [events]);
}
