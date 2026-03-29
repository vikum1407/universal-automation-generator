import { useGlobalTrends } from "../../hooks/useGlobalTrends";
import { useTestRanking } from "../../hooks/useTestRanking";
import { useFailureHotspots } from "../../hooks/useFailureHotspots";
import { useStabilityLeaderboard } from "../../hooks/useStabilityLeaderboard";

import { GlobalTrendChart } from "./GlobalTrendChart";
import { TestRankingTable } from "./TestRankingTable";
import { FailureHotspotList } from "./FailureHotspotList";
import { StabilityLeaderboard } from "./StabilityLeaderboard";

export function GlobalDashboard() {
  const { data: trends } = useGlobalTrends();
  const { data: ranking } = useTestRanking();
  const { data: hotspots } = useFailureHotspots();
  const { data: leaderboard } = useStabilityLeaderboard();

  return (
    <div className="space-y-8">
      <GlobalTrendChart points={trends} />
      <TestRankingTable items={ranking} />
      <FailureHotspotList items={hotspots} />
      <StabilityLeaderboard items={leaderboard} />
    </div>
  );
}
