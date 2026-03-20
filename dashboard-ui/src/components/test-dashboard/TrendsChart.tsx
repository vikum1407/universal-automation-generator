import type { TestDashboard } from "@/types/test-dashboard";
import { Card } from "@/components/Card";
import { TrendChart } from "@/components/TrendChart";

export function TestTrendsChart({
  trends,
}: {
  trends: TestDashboard["trends"]["daily"];
}) {
  const riskTrend = trends.map((d) => ({
    date: d.day,
    successRate: d.successRate,
    failureRate: d.failureRate,
  }));

  const flakiness = trends.map((d) => ({
    date: d.day,
    flakiness: d.flakiness,
  }));

  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Stability & Flakiness</h2>
        <TrendChart riskTrend={riskTrend} flakiness={flakiness} />
      </Card>
    </div>
  );
}
