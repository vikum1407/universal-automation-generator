import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ReleaseBlocker } from "../api/types";

export function useReleaseBlockers() {
  const [data, setData] = useState<ReleaseBlocker[]>([]);

  useEffect(() => {
    AnalyticsAPI.getReleaseBlockers().then((value: unknown) => {
      setData(value as ReleaseBlocker[]);
    });
  }, []);

  return { data };
}
