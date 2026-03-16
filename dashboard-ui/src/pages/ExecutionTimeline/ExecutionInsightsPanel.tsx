import { useExecutionInsights } from "./hooks/useExecutionInsights";
import { InsightsSummaryCards } from "./components/InsightsSummaryCards";
import { RecurringFailuresList } from "./components/RecurringFailuresList";
import { FailureClusters } from "./components/FailureClusters";
import { SlowJourneysTable } from "./components/SlowJourneysTable";
import { FlakyTestsTable } from "./components/FlakyTestsTable";
import { AiInsightsPanel } from "./components/AiInsightsPanel";

export default function ExecutionInsightsPanel() {
  const project = "qlitz-demo";
  const { insights, loading } = useExecutionInsights(project);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
          Execution Insights
        </h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
          Execution Insights
        </h1>
        <p>No insights available.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
        Execution Insights
      </h1>

      <InsightsSummaryCards
        riskScore={insights.summary.riskScore}
        stabilityScore={insights.summary.stabilityScore}
        coverageScore={insights.summary.coverageScore}
        highlights={insights.summary.highlights}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecurringFailuresList failures={insights.recurringFailures} />
        <FailureClusters clusters={insights.clusters} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SlowJourneysTable journeys={insights.slowestJourneys} />
        <FlakyTestsTable flakyTests={insights.flakyTests} />
      </div>

      <AiInsightsPanel insights={insights.aiInsights} />
    </div>
  );
}
