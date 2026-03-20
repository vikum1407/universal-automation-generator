import type { TestDashboard } from "@/types/test-dashboard";
import { Card } from "@/components/Card";
import { RiskBadge } from "@/components/RiskBadge";

export function TestSummaryCards({ summary }: { summary: TestDashboard["summary"] }) {
  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Test Summary</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Total Runs" value={summary.totalRuns} />
          <Metric
            label="Last Status"
            value={
              <RiskBadge
                priority={
                  summary.lastStatus === "failed"
                    ? "P0"
                    : summary.lastStatus === "running"
                    ? "P1"
                    : "P2"
                }
              />
            }
          />
          <Metric
            label="Last Duration"
            value={summary.lastDurationMs != null ? `${summary.lastDurationMs} ms` : "—"}
          />
          <Metric
            label="Success Rate"
            value={`${(summary.successRate * 100).toFixed(1)}%`}
          />
          <Metric
            label="Failure Rate"
            value={`${(summary.failureRate * 100).toFixed(1)}%`}
          />
          <Metric
            label="Flakiness Score"
            value={summary.flakinessScore.toFixed(2)}
          />
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border rounded-md p-3 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
