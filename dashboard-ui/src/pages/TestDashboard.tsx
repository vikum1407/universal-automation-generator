import { useTestDashboard } from "@/hooks/useTestDashboard";

import { TestSummaryCards } from "@/components/test-dashboard/SummaryCards";
import { TestTrendsChart } from "@/components/test-dashboard/TrendsChart";
import { RunHistoryTable } from "@/components/test-dashboard/RunHistoryTable";
import { AiInsightsPanel } from "@/components/test-dashboard/AiInsightsPanel";
import { TestExecutionTimeline } from "@/components/test-dashboard/ExecutionTimeline";
import { AssertionsPanel } from "@/components/test-dashboard/AssertionsPanel";
import { LogsPanel } from "@/components/test-dashboard/LogsPanel";
import { ArtifactsPanel } from "@/components/test-dashboard/ArtifactsPanel";
import { ErrorDetails } from "@/components/test-dashboard/ErrorDetails";

export function TestDashboardPage({ testId }: { testId: string }) {
  const { data, loading, error } = useTestDashboard(testId);

  if (loading) return <div className="p-4">Loading test dashboard…</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-4">No data</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <TestSummaryCards summary={data.summary} />

      <TestTrendsChart trends={data.trends.daily} />

      <RunHistoryTable runs={data.runs} />

      <AiInsightsPanel aiInsights={data.aiInsights} />

      {data.latestRun && (
        <TestExecutionTimeline runId={data.latestRun.runId} />
      )}

      {data.latestRun?.assertions && (
        <AssertionsPanel assertions={data.latestRun.assertions} />
      )}

      {data.latestRun?.logs && (
        <LogsPanel logs={data.latestRun.logs} />
      )}

      {data.latestRun?.artifacts && (
        <ArtifactsPanel artifacts={data.latestRun.artifacts} />
      )}

      {data.latestRun?.error && (
        <ErrorDetails error={data.latestRun.error} />
      )}

    </div>
  );
}
