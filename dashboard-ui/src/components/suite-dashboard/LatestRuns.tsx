import type { SuiteDashboard } from "@/types/suite-dashboard";
import { Card } from "@/components/Card";
import { RiskBadge } from "@/components/RiskBadge";

export default function LatestRuns({
  runs,
}: {
  runs: SuiteDashboard["latestRuns"];
}) {
  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Latest Runs</h2>

        <div className="space-y-3">
          {runs.map((r) => (
            <div
              key={r.runId}
              className="border rounded-md p-3 flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{r.runId}</div>
                <div className="text-xs text-gray-500">{r.startedAt}</div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm">{r.duration} ms</div>

                <RiskBadge
                  priority={
                    r.status === "completed"
                      ? "P2"
                      : r.status === "running"
                      ? "P1"
                      : "P0"
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
