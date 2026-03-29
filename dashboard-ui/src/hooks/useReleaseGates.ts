import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ReleaseGate } from "../api/types";

export function useReleaseGates() {
  const [data, setData] = useState<ReleaseGate[]>([]);

  useEffect(() => {
    AnalyticsAPI.getReleaseGates().then((value: unknown) => {
      setData(value as ReleaseGate[]);
    });
  }, []);

  return { data };
}
