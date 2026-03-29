import { useTestDetail } from "../../hooks/useTestDetail";
import { useFailureClusters } from "../../hooks/useFailureClusters";
import { useFailureHeatmap } from "../../hooks/useFailureHeatmap";
import { useFlakinessTrend } from "../../hooks/useFlakinessTrend";
import { useStabilityForecast } from "../../hooks/useStabilityForecast";
import { useFailureCorrelation } from "../../hooks/useFailureCorrelation";

import { DurationHistogram } from "./DurationHistogram";
import { RecentRunsTable } from "./RecentRunsTable";
import { FailureClusterView } from "./FailureClusterView";
import { FailureHeatmap } from "./FailureHeatmap";
import { FlakinessTrendChart } from "./FlakinessTrendChart";
import { StabilityForecastChart } from "./StabilityForecastChart";
import { FailureCorrelationGraph } from "./FailureCorrelationGraph";

import { AITestGenerationPanel } from "../ai/AITestGenerationPanel";
import { QualityScorePanel } from "../quality/QualityScorePanel";

import { Section } from "../ui/Section";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

export function TestDetailView({ testId }: { testId: string }) {
  const { data, loading } = useTestDetail(testId);
  const { data: clusters } = useFailureClusters(testId);
  const { data: heatmap } = useFailureHeatmap(testId);
  const { data: flakiness } = useFlakinessTrend(testId);
  const { data: forecast } = useStabilityForecast(testId);
  const { data: correlation } = useFailureCorrelation(testId);

  if (loading) return <EmptyState message="Loading test…" />;
  if (!data) return <EmptyState message="No data found" />;

  const { aggregate, histogram, recent } = data;

  return (
    <div className="space-y-8">
      <Section title="Summary">
        <Card>
          <div className="grid grid-cols-3 gap-4">
            <div>Total Runs: {aggregate?.total_runs}</div>
            <div>Passed: {aggregate?.passed_runs}</div>
            <div>Failed: {aggregate?.failed_runs}</div>
            <div>Flaky: {aggregate?.flaky_runs}</div>
            <div>Avg Duration: {Math.round(aggregate?.avg_duration_ms || 0)} ms</div>
            <div>Last Status: {aggregate?.last_status}</div>
          </div>
        </Card>
      </Section>

      <QualityScorePanel testId={testId} />

      <FlakinessTrendChart points={flakiness} />
      <StabilityForecastChart points={forecast} />
      <FailureCorrelationGraph edges={correlation} />

      <FailureClusterView clusters={clusters} />
      <FailureHeatmap cells={heatmap} />

      <AITestGenerationPanel testId={testId} />

      <Section title="Duration Histogram">
        <Card>
          <DurationHistogram buckets={histogram} />
        </Card>
      </Section>

      <Section title="Recent Runs">
        <Card>
          <RecentRunsTable runs={recent} />
        </Card>
      </Section>
    </div>
  );
}
