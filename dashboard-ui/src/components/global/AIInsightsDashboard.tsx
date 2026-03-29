import { usePredictiveFailureModel } from "../../hooks/usePredictiveFailureModel";
import { useTestImpactAnalysis } from "../../hooks/useTestImpactAnalysis";
import { useIntelligentPrioritization } from "../../hooks/useIntelligentPrioritization";

import { PredictiveFailureChart } from "./PredictiveFailureChart";
import { TestImpactGraph } from "./TestImpactGraph";
import { PrioritizationTable } from "./PrioritizationTable";

export function AIInsightsDashboard() {
  const { data: predictive } = usePredictiveFailureModel();
  const { data: impact } = useTestImpactAnalysis();
  const { data: priority } = useIntelligentPrioritization();

  return (
    <div className="space-y-8">
      <PredictiveFailureChart points={predictive} />
      <TestImpactGraph items={impact} />
      <PrioritizationTable items={priority} />
    </div>
  );
}
