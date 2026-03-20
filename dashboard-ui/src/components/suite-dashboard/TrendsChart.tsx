import type { SuiteDashboard } from "@/types/suite-dashboard";
import { Card } from "@/components/Card";
import { TrendChart } from "@/components/TrendChart";

export default function TrendsChart({
  trends,
}: {
  trends: SuiteDashboard["trends"]["daily"];
}) {
  const riskTrend = trends.map((d) => ({
    date: d.day,
    successRate: d.successRate,
    failureRate: d.failureRate,
  }));

  const flakiness = trends.map((d) => ({
    date: d.day,
    flakiness: d.flakiness ?? d.failureRate, // fallback if backend doesn't send flakiness
  }));

  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Execution Trends</h2>

        <TrendChart riskTrend={riskTrend} flakiness={flakiness} />
      </Card>
    </div>
  );
}
