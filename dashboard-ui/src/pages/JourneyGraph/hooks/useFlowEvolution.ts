import { useState, useEffect } from "react";
import { buildFlowEvolution, type FlowEvolutionPoint } from "../../../ai/flow-evolution";

export function useFlowEvolution(snapshots: any[]) {
  const [evolutionPoints, setEvolutionPoints] = useState<FlowEvolutionPoint[]>([]);

  useEffect(() => {
    setEvolutionPoints(buildFlowEvolution(snapshots));
  }, [snapshots]);

  return { evolutionPoints };
}
