import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ReleaseChecklistItem } from "../api/types";

export function useReleaseChecklist() {
  const [data, setData] = useState<ReleaseChecklistItem[]>([]);

  useEffect(() => {
    AnalyticsAPI.getReleaseChecklist().then((value: unknown) => {
      setData(value as ReleaseChecklistItem[]);
    });
  }, []);

  return { data };
}
