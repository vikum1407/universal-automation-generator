import { useEffect, useState } from "react";
import { DashboardAPI } from "../api/dashboard";

export interface GraphData {
  journeys: any[];
  coverage: any;
  svgContent: string;
  loading: boolean;
  error: string | null;
}

export function useGraphData(): GraphData {
  const [journeys, setJourneys] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any>({});
  const [svgContent, setSvgContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [j, c, svg] = await Promise.all([
          DashboardAPI.journeys(),
          DashboardAPI.journeyCoverage(),
          DashboardAPI.journeyGraph()
        ]);

        setJourneys(j);
        setCoverage(c);
        setSvgContent(svg);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load graph data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { journeys, coverage, svgContent, loading, error };
}
