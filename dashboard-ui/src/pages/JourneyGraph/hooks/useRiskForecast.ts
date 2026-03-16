import { useState, useEffect } from "react";
import { forecastRisk, type RiskForecastPoint } from "../../../ai/predictive-risk";

export function useRiskForecast(evolutionPoints: any[]) {
  const [forecast, setForecast] = useState<RiskForecastPoint[]>([]);

  useEffect(() => {
    setForecast(forecastRisk(evolutionPoints, 5));
  }, [evolutionPoints]);

  return { forecast };
}
