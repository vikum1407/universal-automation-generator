import type { SuiteDashboard } from "@/types/suite-dashboard";
import { Card } from "@/components/Card";
import { RiskBadge } from "@/components/RiskBadge";

export default function FlakyAnalysis({
  flaky,
}: {
  flaky: SuiteDashboard["flaky"];
}) {
  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Flaky Analysis</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric
            label="Flaky"
            value={<RiskBadge priority={flaky.isFlaky ? "P0" : "P2"} />}
          />
          <Metric label="Flakiness Score" value={flaky.flakinessScore.toFixed(2)} />
          <Metric label="Status Flips" value={flaky.flips} />
          <Metric label="Failure Clusters" value={flaky.failureClusters} />
          <Metric label="Longest Pass Streak" value={flaky.longestPassStreak} />
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-md p-3 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
