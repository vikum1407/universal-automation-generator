import { useState, useEffect } from "react";
import { setupEvolutionHeatmap } from "../../../graph/graph-evolution-heatmap";

export function useEvolutionHeatmap(g: any, snapshots: any[]) {
  const [mode, setMode] = useState("none");
  const [heat, setHeat] = useState<any>(null);

  useEffect(() => {
    if (!g || snapshots.length === 0) return;
    const h = setupEvolutionHeatmap(g, snapshots, mode as any);
    setHeat(h);
  }, [g, snapshots, mode]);

  useEffect(() => {
    if (!heat) return;
    if (mode === "none") heat.clearHeat();
    else heat.applyHeat();
  }, [heat, mode]);

  return { mode, setMode };
}
