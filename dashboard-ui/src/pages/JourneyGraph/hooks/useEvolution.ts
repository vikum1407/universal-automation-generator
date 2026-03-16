import { useState } from "react";
import { computeEvolutionDiff } from "../../../ai/evolution-engine";

export function useEvolution(graphData: any) {
  const [evolution, setEvolution] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);

  function handleEvolution() {
    const diff = computeEvolutionDiff(
      graphData.journeys,
      graphData.journeys,
      graphData.coverage,
      graphData.coverage
    );

    setEvolution(diff);
    setSnapshots([{ id: "Snapshot 1", diff }]);
  }

  return { evolution, snapshots, handleEvolution };
}
