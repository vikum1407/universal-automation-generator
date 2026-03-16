import { useEffect, useState } from "react";

export type HeatmapCell = {
  journey: string;
  component: string;
  risk: "low" | "medium" | "high";
  score: number;
};

export type ReleaseHeatmapData = {
  journeys: string[];
  components: string[];
  cells: HeatmapCell[];
};

const FALLBACK_COMPONENTS = ["ui", "api", "db", "auth", "payments"];

export function useReleaseHeatmap(project: string) {
  const [data, setData] = useState<ReleaseHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/release/${project}/heatmap`)
      .then(res => res.json())
      .then((json: ReleaseHeatmapData) => {
        const components =
          json.components && json.components.length
            ? json.components
            : FALLBACK_COMPONENTS;
        setData({ ...json, components });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [project]);

  return { data, loading };
}
