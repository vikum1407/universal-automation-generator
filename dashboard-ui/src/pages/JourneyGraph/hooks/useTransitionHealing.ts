import { useState } from "react";
import { healTransitions, type TransitionHealingResult } from "../../../ai/transition-healing";

type GraphShape = {
  pages: any[];
  transitions: any[];
  clusters: any[];
};

export function useTransitionHealing(
  graph: GraphShape,
  evolutionPoints: any[],
  anomalies: any[],
  forecast: any[]
) {
  const [result, setResult] = useState<TransitionHealingResult | null>(null);

  function runHealing() {
    const healed: TransitionHealingResult = healTransitions(
      graph,
      evolutionPoints,
      anomalies,
      forecast
    );
    setResult(healed);
  }

  return {
    result,
    runHealing
  };
}
