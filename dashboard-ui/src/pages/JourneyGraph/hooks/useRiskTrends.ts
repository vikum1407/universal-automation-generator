import { useState, useEffect } from "react";
import { buildRiskTrend, type RiskTrendPoint } from "../../../ai/risk-trend";

export function useRiskTrends(snapshots: any[]) {
  const [trend, setTrend] = useState<RiskTrendPoint[]>([]);

  useEffect(() => {
    setTrend(buildRiskTrend(snapshots));
  }, [snapshots]);

  return { trend };
}
