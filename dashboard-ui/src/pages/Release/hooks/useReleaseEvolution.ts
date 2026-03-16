import { useEffect, useState } from "react";

export type EvolutionTrends = {
  passRate: "improving" | "worsening" | "stable";
  failureRate: "improving" | "worsening" | "stable";
  duration: "improving" | "worsening" | "stable";
  stability: "improving" | "worsening" | "stable";
};

export type EvolutionForecast = {
  nextRunRiskScore: number;
  confidence: "low" | "medium" | "high";
};

export type ReleaseEvolutionData = {
  trends: EvolutionTrends;
  riskForecast: EvolutionForecast;
  recommendations: string[];
};

export function useReleaseEvolution(project: string) {
  const [data, setData] = useState<ReleaseEvolutionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/release/${project}/evolution`)
      .then(res => res.json())
      .then((json: ReleaseEvolutionData) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [project]);

  return { data, loading };
}
