import { useSearchParams } from "react-router-dom";
import { useExecutionCompare } from "./hooks/useExecutionCompare";
import { CompareSummaryCards } from "./components/CompareSummaryCards";
import { TestDiffTable } from "./components/TestDiffTable";
import { JourneyDiffTable } from "./components/JourneyDiffTable";
import { AiCompareInsightsPanel } from "./components/AiCompareInsightsPanel";

export default function ExecutionComparePanel() {
  const project = "qlitz-demo";
  const [params] = useSearchParams();
  const runA = params.get("runA") ?? "";
  const runB = params.get("runB") ?? "";

  const { data, loading } = useExecutionCompare(project, runA, runB);

  if (!runA || !runB) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
          Execution Compare
        </h1>
        <p className="text-sm text-gray-700 dark:text-slate-200">
          Please provide <code>runA</code> and <code>runB</code> query
          parameters in the URL.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
          Execution Compare
        </h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
          Execution Compare
        </h1>
        <p>No comparison data available.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
        Execution Compare
      </h1>

      <CompareSummaryCards runA={data.runA} runB={data.runB} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TestDiffTable diff={data.testDiff} />
        <JourneyDiffTable journeys={data.journeyDiff} />
      </div>

      <AiCompareInsightsPanel insights={data.aiInsights} />
    </div>
  );
}
