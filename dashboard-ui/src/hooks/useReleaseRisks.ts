import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ReleaseRiskItem } from "../api/types";

export function useReleaseRisks() {
  const [data, setData] = useState<ReleaseRiskItem[]>([]);

  useEffect(() => {
    AnalyticsAPI.getReleaseRisks().then((value: unknown) => {
      setData(value as ReleaseRiskItem[]);
    });
  }, []);

  return { data };
}
