import { useState, useEffect } from "react";
import { setupEvolutionPlayback } from "../../../graph/graph-evolution-playback";

export function usePlayback(g: any, snapshots: any[]) {
  const [evoPlayback, setEvoPlayback] = useState<any>(null);
  const [evoIndex, setEvoIndex] = useState(0);

  useEffect(() => {
    if (!g || snapshots.length === 0) return;
    const evo = setupEvolutionPlayback(g, snapshots);
    setEvoPlayback(evo);
  }, [g, snapshots]);

  return { evoPlayback, evoIndex, setEvoIndex };
}
