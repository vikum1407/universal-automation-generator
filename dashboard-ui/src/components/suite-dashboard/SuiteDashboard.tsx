import { useSuiteDashboard } from "@/hooks/useSuiteDashboard";
import SummaryCards from "@/components/suite-dashboard/SummaryCards";
import Leaderboards from "@/components/suite-dashboard/Leaderboards";
import FlakyAnalysis from "@/components/suite-dashboard/FlakyAnalysis";
import TrendsChart from "@/components/suite-dashboard/TrendsChart";
import LatestRuns from "@/components/suite-dashboard/LatestRuns";

export default function SuiteDashboardPage({ suiteId }: { suiteId: string }) {
  const { data, loading, error } = useSuiteDashboard(suiteId);

  if (loading) return <div>Loading suite dashboard…</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Suite Dashboard — {data.suiteId}</h1>

      <SummaryCards summary={data.summary} />

      <Leaderboards leaderboards={data.leaderboards} />

      <FlakyAnalysis flaky={data.flaky} />

      <TrendsChart trends={data.trends.daily} />

      <LatestRuns runs={data.latestRuns} />
    </div>
  );
}
