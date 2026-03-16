import { useState, useEffect } from "react";
import { detectAnomalies, type AnomalyPoint } from "../../../ai/anomaly-engine";

export function useAnomalies(flow: any[]) {
  const [anomalies, setAnomalies] = useState<AnomalyPoint[]>([]);

  useEffect(() => {
    setAnomalies(detectAnomalies(flow));
  }, [flow]);

  return { anomalies };
}
